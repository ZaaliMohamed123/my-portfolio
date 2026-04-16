import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Subject, fromEvent, debounceTime, takeUntil } from 'rxjs';

import { Header } from '../header/header';
import { Footer } from '../footer/footer';

interface Section {
  id: string;
  name: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    TranslocoModule,
    Header, Footer
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout implements OnInit, OnDestroy {
  
  // Loading state
  isLoading = true;
  
  // Scroll tracking
  scrollProgress = 0;
  activeSection = 'home';
  // showNavigation = false;
  showBackToTop = false;
  
  // Math utility for template
  Math = Math;
  
  // Portfolio sections
  sections: Section[] = [
    { id: 'home', name: 'nav.home' },
    { id: 'about', name: 'nav.about' },
    { id: 'education', name: 'nav.education' },
    { id: 'experience', name: 'nav.experience' },
    { id: 'projects', name: 'nav.projects' },
    { id: 'skills', name: 'nav.skills' },
    { id: 'contact', name: 'nav.contact' }
  ];
  
  private destroy$ = new Subject<void>();
  private intersectionObserver?: IntersectionObserver;

  ngOnInit() {
    this.initializeLayout();
    this.setupScrollTracking();
    this.setupIntersectionObserver();
    this.simulateLoading();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  private initializeLayout() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.body.classList.add('reduced-motion');
    }
  }

  private setupScrollTracking() {
    // Debounced scroll listener for performance
    fromEvent(window, 'scroll')
      .pipe(
        debounceTime(16), // ~60fps
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateScrollProgress();
        this.updateNavigationVisibility();
      });
  }

  private updateScrollProgress() {
    const scrolled = window.scrollY;
    const maxHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    if (maxHeight > 0) {
      this.scrollProgress = Math.min((scrolled / maxHeight) * 100, 100);
    }
  }

  private updateNavigationVisibility() {
    const scrolled = window.scrollY;
    
    // Show navigation after scrolling past the first section
    // this.showNavigation = scrolled > window.innerHeight * 0.3;
    
    // Show back to top after more scrolling
    this.showBackToTop = scrolled > window.innerHeight * 0.8;
  }

  private setupIntersectionObserver() {
    // Set up intersection observer for active section tracking
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            this.activeSection = entry.target.id;
          }
        });
      },
      {
        rootMargin: '-20% 0px -20% 0px',
        threshold: [0.1, 0.5, 0.9]
      }
    );

    // Observe sections when they're available
    setTimeout(() => {
      this.sections.forEach(section => {
        const element = document.getElementById(section.id);
        if (element && this.intersectionObserver) {
          this.intersectionObserver.observe(element);
        }
      });
    }, 1000);
  }

  private simulateLoading() {
    // Simple loading simulation
    setTimeout(() => {
      this.isLoading = false;
    }, 1500);
  }

  // Public methods for navigation
  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.offsetTop - 80; // Account for fixed header
      
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // TrackBy function for performance
  trackSection(index: number, section: Section): string {
    return section.id;
  }

  // Handle window resize
  @HostListener('window:resize')
  onResize() {
    // Recalculate scroll progress on resize
    this.updateScrollProgress();
  }
}
