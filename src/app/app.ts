import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ThemeService } from './core/services/theme';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TranslocoModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'mohamed-portfolio';

  constructor(private themeService: ThemeService) {}
}
