import { Component, OnInit, OnDestroy, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { Subject, fromEvent, debounceTime, takeUntil } from 'rxjs';

import { LanguageSwitcher } from '../../shared/components/language-switcher/language-switcher';
import { ThemeToggle } from '../../shared/components/theme-toggle/theme-toggle';

interface NavigationSection {
  id: string;
  name: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    LanguageSwitcher,
    ThemeToggle
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header implements OnInit, OnDestroy {
  
  // Output events for parent components
  @Output() themeToggled = new EventEmitter<boolean>();
  @Output() languageChanged = new EventEmitter<string>();
  @Output() navigationChanged = new EventEmitter<string>();
  
  // Component state
  isScrolled = false;
  isMobileMenuOpen = false;
  activeSection = 'home';
  
  // Navigation configuration - matches your portfolio structure
  navigationSections: NavigationSection[] = [
  {
    id: 'home',
    name: 'nav.home',
    description: 'nav.home_desc',
    icon: 'fa-home'
  },
  {
    id: 'about',
    name: 'nav.about',
    description: 'nav.about_desc',
    icon: 'fa-user'
  },
  {
    id: 'education',
    name: 'nav.education',
    description: 'nav.education_desc',
    icon: 'fa-graduation-cap'
  },
  {
    id: 'experience',
    name: 'nav.experience',
    description: 'nav.experience_desc',
    icon: 'fa-briefcase'
  },
  {
    id: 'projects',
    name: 'nav.projects',
    description: 'nav.projects_desc',
    icon: 'fa-rocket'
  },
  {
    id: 'skills',
    name: 'nav.skills',
    description: 'nav.skills_desc',
    icon: 'fa-code'
  },
  {
    id: 'contact',
    name: 'nav.contact',
    description: 'nav.contact_desc',
    icon: 'fa-envelope'
  }
];
  
  // Internal state management
  private destroy$ = new Subject<void>();
  private intersectionObserver?: IntersectionObserver;
  private scrollThreshold = 50; // Pixels to scroll before header style changes

  ngOnInit() {
    this.setupScrollListener();
    this.setupIntersectionObserver();
    this.setupKeyboardNavigation();
    this.preloadMobileMenuAnimations();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    // Clean up any event listeners
    this.closeMobileMenu();
  }

  // ========================
  // SCROLL MANAGEMENT
  // ========================
  
  private setupScrollListener() {
    // Optimized scroll listener with debouncing
    fromEvent(window, 'scroll', { passive: true })
      .pipe(
        debounceTime(10), // ~100fps for smooth header transitions
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.handleScroll();
      });
  }

  private handleScroll() {
    const scrollTop = window.scrollY;
    const newScrollState = scrollTop > this.scrollThreshold;
    
    // Only update if state actually changed (performance optimization)
    if (newScrollState !== this.isScrolled) {
      this.isScrolled = newScrollState;
      
      // Add smooth transition class
      document.body.classList.toggle('header-scrolled', this.isScrolled);
    }
  }

  // ========================
  // SECTION TRACKING
  // ========================
  
  private setupIntersectionObserver() {
    // Track active section for navigation highlighting
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        // Find the section that's most visible
        let mostVisible = entries[0];
        let maxRatio = 0;
        
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            mostVisible = entry;
            maxRatio = entry.intersectionRatio;
          }
        });
        
        if (mostVisible && mostVisible.isIntersecting) {
          const newActiveSection = mostVisible.target.id;
          if (newActiveSection !== this.activeSection) {
            this.activeSection = newActiveSection;
            this.navigationChanged.emit(newActiveSection);
          }
        }
      },
      {
        rootMargin: '-20% 0px -20% 0px', // Only consider center 60% of viewport
        threshold: [0.1, 0.3, 0.5, 0.7, 0.9] // Multiple thresholds for accuracy
      }
    );

    // Start observing sections after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.navigationSections.forEach(section => {
        const element = document.getElementById(section.id);
        if (element && this.intersectionObserver) {
          this.intersectionObserver.observe(element);
        }
      });
    }, 1000);
  }

  // ========================
  // NAVIGATION METHODS
  // ========================
  
  scrollToSection(sectionId: string, event?: Event) {
    if (event) {
      event.preventDefault();
    }
    
    const element = document.getElementById(sectionId);
    if (element) {
      // Calculate offset for fixed header
      const headerHeight = this.getHeaderHeight();
      const offsetTop = element.offsetTop - headerHeight - 20; // Extra 20px padding
      
      // Smooth scroll to section
      window.scrollTo({
        top: Math.max(0, offsetTop),
        behavior: 'smooth'
      });
      
      // Close mobile menu if open
      if (this.isMobileMenuOpen) {
        this.closeMobileMenu();
      }
      
      // Emit navigation event
      this.navigationChanged.emit(sectionId);
      
      // Update active section immediately for better UX
      this.activeSection = sectionId;
    }
  }

  private getHeaderHeight(): number {
    const header = document.querySelector('.portfolio-header') as HTMLElement;
    return header ? header.offsetHeight : 80; // Fallback height
  }

  // ========================
  // MOBILE MENU MANAGEMENT
  // ========================
  
  toggleMobileMenu() {
    if (this.isMobileMenuOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  openMobileMenu() {
    this.isMobileMenuOpen = true;
    document.body.classList.add('mobile-menu-open');
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = 'hidden';
    
    // Focus first menu item for accessibility
    setTimeout(() => {
      const firstMenuItem = document.querySelector('.mobile-nav-link') as HTMLElement;
      if (firstMenuItem) {
        firstMenuItem.focus();
      }
    }, 300);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    document.body.classList.remove('mobile-menu-open');
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Return focus to menu toggle button
    const menuToggle = document.querySelector('.mobile-menu-toggle') as HTMLElement;
    if (menuToggle) {
      menuToggle.focus();
    }
  }

  onMobileNavClick(sectionId: string) {
    // Add slight delay for better UX
    setTimeout(() => {
      this.scrollToSection(sectionId);
    }, 150);
  }

  // ========================
  // EVENT HANDLERS
  // ========================
  
  onThemeChange(isDarkMode: boolean) {
    this.themeToggled.emit(isDarkMode);
    
    // Add subtle animation to header on theme change
    const header = document.querySelector('.portfolio-header') as HTMLElement;
    if (header) {
      header.style.transform = 'scale(0.99)';
      setTimeout(() => {
        header.style.transform = '';
      }, 200);
    }
  }

  onLanguageChange(language: string) {
    this.languageChanged.emit(language);
  }

  // ========================
  // KEYBOARD NAVIGATION
  // ========================
  
  private setupKeyboardNavigation() {
    // Handle keyboard shortcuts
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.handleKeyboardShortcuts(event);
      });
  }

  private handleKeyboardShortcuts(event: KeyboardEvent) {
    // Close mobile menu on Escape
    if (event.key === 'Escape' && this.isMobileMenuOpen) {
      this.closeMobileMenu();
      return;
    }
    
    // Navigation shortcuts (Ctrl/Cmd + number)
    if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '8') {
      event.preventDefault();
      const sectionIndex = parseInt(event.key) - 1;
      const section = this.navigationSections[sectionIndex];
      if (section) {
        this.scrollToSection(section.id);
      }
    }
  }

  // ========================
  // PERFORMANCE OPTIMIZATIONS
  // ========================
  
  private preloadMobileMenuAnimations() {
    // Preload mobile menu styles for smoother animations
    if (window.innerWidth <= 1024) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = '/assets/mobile-menu-animations.css';
      document.head.appendChild(link);
    }
  }

  // Track function for performance optimization
  trackSection(index: number, section: NavigationSection): string {
    return section.id;
  }

  // ========================
  // HOST LISTENERS
  // ========================
  
  // Handle window resize
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    // Close mobile menu on desktop resize
    if (window.innerWidth >= 1024 && this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
    
    // Recalculate scroll threshold based on screen size
    this.scrollThreshold = window.innerWidth < 768 ? 30 : 50;
  }

  // Handle clicks outside mobile menu
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    
    // Close mobile menu if clicking outside
    if (this.isMobileMenuOpen && 
        !target.closest('.mobile-nav-overlay') && 
        !target.closest('.mobile-menu-toggle')) {
      this.closeMobileMenu();
    }
  }

  // Handle orientation change (mobile)
  @HostListener('window:orientationchange')
  onOrientationChange() {
    // Close mobile menu on orientation change
    if (this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
    
    // Recalculate dimensions after orientation change
    setTimeout(() => {
      this.handleScroll();
    }, 100);
  }

  // Handle focus management
  @HostListener('focusin', ['$event'])
  onFocusIn(event: FocusEvent) {
    const target = event.target as HTMLElement;
    
    // Ensure mobile menu items are properly focused
    if (this.isMobileMenuOpen && target.closest('.mobile-nav-menu')) {
      target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  // ========================
  // UTILITY METHODS
  // ========================
  
  // Get current section for external components
  getCurrentSection(): string {
    return this.activeSection;
  }

  // Check if mobile menu is open (for external components)
  isMobileMenuActive(): boolean {
    return this.isMobileMenuOpen;
  }

  // Programmatically set active section (for external use)
  setActiveSection(sectionId: string) {
    if (this.navigationSections.find(section => section.id === sectionId)) {
      this.activeSection = sectionId;
    }
  }

  // Get navigation sections (for external use)
  getNavigationSections(): NavigationSection[] {
    return this.navigationSections;
  }
}
