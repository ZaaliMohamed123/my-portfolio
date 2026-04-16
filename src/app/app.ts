import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ThemeService } from './core/services/theme';
import { SplashCursor } from './shared/components/splash-cursor/splash-cursor';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TranslocoModule, SplashCursor],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'mohamed-portfolio';

  constructor(private themeService: ThemeService) {}
}
