import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './experience.html',
  styleUrl: './experience.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Experience implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  // FadeIn Animation
  @ViewChild('experienceSection') experienceSection!: ElementRef;
  experienceInView = false;

  // Scroll Detection
  visibleSections = new Set<string>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.initializeScrollObserver();
  }

  ngAfterViewInit() {
    // FadeIn Animation Observer
    const fadeInObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === this.experienceSection.nativeElement) {
            if (entry.isIntersecting) {
              this.experienceInView = true;
              this.cdr.detectChanges();
            }
          }
        });
      },
      { threshold: 0.2 }
    );
    
    if (this.experienceSection?.nativeElement) {
      fadeInObserver.observe(this.experienceSection.nativeElement);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================
  // SCROLL ANIMATIONS
  // ========================

  private initializeScrollObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Staggered animation for timeline
            setTimeout(() => {
              this.visibleSections.add('timeline');
              this.cdr.detectChanges();
            }, 200);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px',
      }
    );

    setTimeout(() => {
      const experienceSection = document.getElementById('experience');
      if (experienceSection) {
        observer.observe(experienceSection);
      }
    }, 100);
  }

  // ========================
  // UTILITY METHODS
  // ========================

  // Get current section for external components
  getCurrentSection(): string {
    return 'experience';
  }

  // Track function for performance optimization (if needed for future expansions)
  trackExperience(index: number, experience: any): string {
    return experience.id || index;
  }
}
