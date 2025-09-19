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
  selector: 'app-education',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './education.html',
  styleUrl: './education.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Education implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  // FadeIn Animation
  @ViewChild('educationSection') educationSection!: ElementRef;
  educationInView = false;

  // Expandable Certifications
  expandedCert: string | null = null;

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
          if (entry.target === this.educationSection.nativeElement) {
            if (entry.isIntersecting) {
              this.educationInView = true;
              this.cdr.detectChanges();
            }
          }
        });
      },
      { threshold: 0.2 }
    );
    
    if (this.educationSection?.nativeElement) {
      fadeInObserver.observe(this.educationSection.nativeElement);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================
  // CERTIFICATION EXPANSION
  // ========================

  toggleCertification(certId: string) {
    if (this.expandedCert === certId) {
      this.expandedCert = null;
    } else {
      this.expandedCert = certId;
    }
    this.cdr.detectChanges();
  }

  // ========================
  // SCROLL ANIMATIONS
  // ========================

  private initializeScrollObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Staggered animation for different sections
            setTimeout(() => {
              this.visibleSections.add('timeline');
              this.cdr.detectChanges();
            }, 200);

            setTimeout(() => {
              this.visibleSections.add('certifications');
              this.cdr.detectChanges();
            }, 600);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px',
      }
    );

    setTimeout(() => {
      const educationSection = document.getElementById('education');
      if (educationSection) {
        observer.observe(educationSection);
      }
    }, 100);
  }
}
