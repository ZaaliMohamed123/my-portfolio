import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

import { Project } from '../../core/models';
import { ProjectsService } from '../../core/services/projects.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoModule],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetail implements OnInit, OnDestroy {
  
  project: Project | null = null;
  isLoading = true;
  notFound = false;
  safeVideoUrl: SafeResourceUrl | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectsService: ProjectsService,
    private translocoService: TranslocoService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);

    // Load project based on ID
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const id = parseInt(params['id'], 10);
        if (id) {
          this.loadProject(id);
        }
      });

    // Reload when language changes
    this.translocoService.langChanges$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const id = parseInt(this.route.snapshot.params['id'], 10);
        if (id) {
          this.loadProject(id);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProject(id: number): void {
    this.isLoading = true;
    this.notFound = false;
    this.cdr.markForCheck();

    this.projectsService.loadAllData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Find project by ID
          this.project = data.projects.find(p => p.id === id) || null;
          
          if (!this.project) {
            this.notFound = true;
          } else if (this.project.videoTuto) {
            // Sanitize video URL if exists
            this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
              this.project.videoTuto
            );
          }

          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading project:', error);
          this.notFound = true;
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/projects-gallery']);
  }
}
