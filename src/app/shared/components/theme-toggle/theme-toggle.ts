import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss'
})
export class ThemeToggle implements OnInit, OnDestroy {
  
  @Output() themeChanged = new EventEmitter<boolean>();
  
  isDarkMode = false;
  private destroy$ = new Subject<void>();

  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    // S'abonner au thème du service
    this.themeService.isDarkMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isDark => {
        this.isDarkMode = isDark;
        this.applyMetaThemeColor(isDark);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleTheme() {
    this.themeService.toggleTheme();
    this.themeChanged.emit(this.themeService.getCurrentTheme());
  }

  private applyMetaThemeColor(isDark: boolean) {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', 
        isDark ? '#0F172A' : '#FFFFFF'
      );
    }
  }
}
