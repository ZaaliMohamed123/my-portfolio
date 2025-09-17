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
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './about.html',
  styleUrl: './about.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  // FadeIn Animation
  @ViewChild('aboutSection') aboutSection!: ElementRef;
  aboutInView = false;

  // Values Cards
  activeValue: string | null = null;

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
          if (entry.target === this.aboutSection.nativeElement) {
            if (entry.isIntersecting) {
              this.aboutInView = true;
              this.cdr.detectChanges();
            }
          }
        });
      },
      { threshold: 0.2 }
    );
    
    if (this.aboutSection?.nativeElement) {
      fadeInObserver.observe(this.aboutSection.nativeElement);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================
  // VALUES CARDS
  // ========================

  showValueDetails(value: string) {
    this.activeValue = value;
    this.cdr.detectChanges();
  }

  hideValueDetails(value: string) {
    if (this.activeValue === value) {
      this.activeValue = null;
      this.cdr.detectChanges();
    }
  }

  // ========================
  // SCROLL ANIMATIONS
  // ========================

  private initializeScrollObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.visibleSections.add('main');
            this.visibleSections.add('values');
            this.visibleSections.add('cta');
            this.cdr.detectChanges();
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px',
      }
    );

    setTimeout(() => {
      const aboutSection = document.getElementById('about');
      if (aboutSection) {
        observer.observe(aboutSection);
      }
    }, 100);
  }
}
