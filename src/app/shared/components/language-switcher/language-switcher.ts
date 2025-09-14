import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoService } from '@jsverse/transloco';

interface Language {
  code: string;
  name: string;
  flag: string;
}

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.scss'
})
export class LanguageSwitcher implements OnInit {
  
  isOpen = false;
  currentLanguage = 'en';
  
  // Available languages [web:282]
  languages: Language[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  constructor(private translocoService: TranslocoService) {}

  ngOnInit() {
    this.currentLanguage = this.translocoService.getActiveLang();
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  selectLanguage(languageCode: string) {
    if (languageCode !== this.currentLanguage) {
      this.currentLanguage = languageCode;
      this.translocoService.setActiveLang(languageCode);
      
      // Store preference
      localStorage.setItem('preferredLanguage', languageCode);
    }
    
    this.closeDropdown();
  }

  getCurrentLanguageCode(): string {
    return this.currentLanguage.toUpperCase();
  }

  getCurrentLanguageName(): string {
    const currentLang = this.languages.find(lang => lang.code === this.currentLanguage);
    return currentLang?.name || 'English';
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.language-switcher')) {
      this.closeDropdown();
    }
  }

  // Handle escape key
  @HostListener('document:keydown.escape')
  onEscapeKey() {
    this.closeDropdown();
  }
}
