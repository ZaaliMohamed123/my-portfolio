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
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';
import { Router, RouterModule } from '@angular/router';

import { Certification } from '../../../../core/models';
import { CertificationsService } from '../../../../core/services/certifications';

@Component({
  selector: 'app-education',
  standalone: true,
  imports: [CommonModule, TranslocoModule, RouterModule],
  templateUrl: './education.html',
  styleUrl: './education.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Education implements OnInit, OnDestroy, AfterViewInit {
  
  private destroy$ = new Subject<void>();

  // FadeIn Animation
  @ViewChild('educationSection') educationSection!: ElementRef;
  educationInView = false;

  // Certifications Data
  certifications: Certification[] = [];
  displayedCertifications: Certification[] = [];
  initialDisplayCount = 3; // Show first 3 certifications by default

  // Expandable Certifications
  expandedCert: number | null = null;

  // Loading State
  isLoading = true;

  // Scroll Detection
  visibleSections = new Set<string>();

  constructor(
    private certificationsService: CertificationsService,
    private translocoService: TranslocoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initializeScrollObserver();
    this.loadCertifications();

    // Reload certifications when language changes
    this.translocoService.langChanges$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadCertifications();
      });
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
      { threshold: 0.02, 
        rootMargin: '0px 0px -5% 0px'
       }
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
  // CERTIFICATIONS LOADING
  // ========================

  private loadCertifications(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    // Charger seulement les 3 dernières certifications
    this.certificationsService.getLatestCertifications(3)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (certifications) => {
          this.certifications = certifications;
          this.displayedCertifications = certifications;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading certifications:', error);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  // ========================
  // CERTIFICATION EXPANSION
  // ========================

  toggleCertification(certId: number): void {
    if (this.expandedCert === certId) {
      this.expandedCert = null;
    } else {
      this.expandedCert = certId;
    }
    this.cdr.detectChanges();
  }

  // ========================
  // PROVIDER BADGE CLASS
  // ========================

  getProviderClass(provider: string): string {
    return provider.toLowerCase().replace(/\s+/g, '-');
  }

  // ========================
  // OPEN CREDENTIAL
  // ========================

  openCredential(url: string, event: Event): void {
    event.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // ========================
  // TRACK FUNCTION
  // ========================

  trackCertification(index: number, certification: Certification): number {
    return certification.id;
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


  get hasMoreCertifications(): boolean {
    // Toujours true si on a des certifications (on assume qu'il y en a plus)
    return this.certifications.length >= 3;
  }
}
