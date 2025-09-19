import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, ActivatedRoute } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

// Import components
import { Home } from './components/home/home';
import { About } from './components/about/about';
import { Education } from './components/education/education';
import { Experience } from './components/experience/experience';

@Component({
  selector: 'app-main-portfolio',
  standalone: true,
  imports: [CommonModule, TranslocoModule, Home, About, Education,
    Experience],
  templateUrl: './main-portfolio.html',
  styleUrl: './main-portfolio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPortfolio implements OnInit, AfterViewInit {
  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // Handle section navigation from routes
    this.route.params.subscribe((params) => {
      const section = params['section'];
      if (section) {
        setTimeout(() => this.scrollToSection(section), 100);
      }
    });
  }

  ngAfterViewInit() {
    // Handle fragment-based navigation
    this.route.fragment.subscribe((fragment) => {
      if (fragment) {
        setTimeout(() => this.scrollToSection(fragment), 100);
      }
    });
  }

  private scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80; // Account for fixed header
      const offsetTop = element.offsetTop - headerHeight;

      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
      });
    }
  }
}
