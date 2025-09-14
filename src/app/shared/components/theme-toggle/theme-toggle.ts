import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss'
})
export class ThemeToggle implements OnInit {
  
  @Output() themeChanged = new EventEmitter<boolean>();
  
  isDarkMode = false;

  ngOnInit() {
    this.loadThemePreference();
    this.applyTheme();
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.saveThemePreference();
    this.applyTheme();
    this.themeChanged.emit(this.isDarkMode);
  }

  private loadThemePreference() {
    const savedTheme = localStorage.getItem('darkMode');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    this.isDarkMode = savedTheme 
      ? savedTheme === 'true' 
      : systemPrefersDark;
  }

  private saveThemePreference() {
    localStorage.setItem('darkMode', this.isDarkMode.toString());
  }

  private applyTheme() {
    document.body.classList.toggle('dark-mode', this.isDarkMode);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', 
        this.isDarkMode ? '#0F172A' : '#FFFFFF'
      );
    }
  }
}
