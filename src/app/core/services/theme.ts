import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'darkMode';
  private darkModeSubject = new BehaviorSubject<boolean>(this.getInitialTheme());
  
  public isDarkMode$: Observable<boolean> = this.darkModeSubject.asObservable();

  constructor() {
    this.applyTheme(this.darkModeSubject.value);
  }

  private getInitialTheme(): boolean {
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    if (savedTheme !== null) {
      return savedTheme === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  toggleTheme(): void {
    const newTheme = !this.darkModeSubject.value;
    this.darkModeSubject.next(newTheme);
    this.applyTheme(newTheme);
    this.saveTheme(newTheme);
  }

  setTheme(isDark: boolean): void {
    this.darkModeSubject.next(isDark);
    this.applyTheme(isDark);
    this.saveTheme(isDark);
  }

  getCurrentTheme(): boolean {
    return this.darkModeSubject.value;
  }

  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
  }

  private saveTheme(isDark: boolean): void {
    localStorage.setItem(this.THEME_KEY, isDark.toString());
  }
}
