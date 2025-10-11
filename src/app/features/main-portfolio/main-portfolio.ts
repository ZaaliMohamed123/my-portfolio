import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef,ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, ActivatedRoute } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Import components
import { Home } from './components/home/home';
import { About } from './components/about/about';
import { Education } from './components/education/education';
import { Experience } from './components/experience/experience';
import { Skills } from './components/skills/skills';
import { Contact } from './components/contact/contact';
import { Projects } from './components/projects/projects';

@Component({
  selector: 'app-main-portfolio',
  standalone: true,
  imports: [CommonModule, TranslocoModule, Home, About, Education, Experience, Skills, Contact, Projects],
  templateUrl: './main-portfolio.html',
  styleUrl: './main-portfolio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPortfolio implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  private initialFragment: string = '';

  constructor(private route: ActivatedRoute, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    // Capturer le fragment AVANT tout
    this.initialFragment = window.location.hash.substring(1);
    
    // Force scroll to top immédiatement pour éviter le décalage
    if (!this.initialFragment || this.initialFragment === 'home') {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    
    // Handle section navigation from routes
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const section = params['section'];
        if (section) {
          setTimeout(() => this.scrollToSection(section), 100);
        }
      });
  }

  ngAfterViewInit() {
    // Attendre que la vue soit complètement chargée
    setTimeout(() => {
      if (this.initialFragment && this.initialFragment !== 'home') {
        // Scroller vers la section demandée
        this.scrollToSection(this.initialFragment);
        window.history.replaceState(null, '', `/#${this.initialFragment}`);
      } else {
        // Force scroll to top une deuxième fois après le rendu
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        window.history.replaceState(null, '', '/#home');
      }
    }, 0);

    // Handle fragment-based navigation
    this.route.fragment
      .pipe(takeUntil(this.destroy$))
      .subscribe((fragment) => {
        if (fragment && fragment !== 'home') {
          setTimeout(() => this.scrollToSection(fragment), 100);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
