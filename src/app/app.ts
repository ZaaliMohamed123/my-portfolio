import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TranslocoModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'mohamed-portfolio';
}
