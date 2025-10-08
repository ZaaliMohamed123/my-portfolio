import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { HttpClient } from '@angular/common/http';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

// Import models
import { Project, Technology } from '../../../../core/models';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoModule],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Projects implements OnInit, OnDestroy {
  
  // Component State
  featuredProjects: Project[] = [];
  isLoading = true;
  
  // Lifecycle Management
  private destroy$ = new Subject<void>();
  
  constructor(
    private http: HttpClient,
    private translocoService: TranslocoService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    this.loadProjectData();
    
    // Reload data when language changes
    this.translocoService.langChanges$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadProjectData();
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Load project and technology data from JSON files
   */
  private loadProjectData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    
    const currentLang = this.translocoService.getActiveLang();
    const projectsPath = `assets/data/projects.${currentLang}.json`;
    const technologiesPath = `assets/data/technologies.json`;
    
    // Load both files in parallel
    forkJoin({
      projects: this.http.get<Project[]>(projectsPath).pipe(
        catchError(error => {
          console.error('Error loading projects:', error);
          return of([]);
        })
      ),
      technologies: this.http.get<Technology[]>(technologiesPath).pipe(
        catchError(error => {
          console.error('Error loading technologies:', error);
          return of([]);
        })
      )
    })
    .pipe(
      takeUntil(this.destroy$),
      map(data => {
        // Map technology names to full Technology objects
        const techMap = new Map(data.technologies.map(tech => [tech.name, tech]));
        
        return data.projects.map(project => ({
          ...project,
          technologies: project.technologies
            .map(techName => {
              // If it's already a Technology object, return it
              if (typeof techName === 'object' && 'name' in techName) {
                return techName as Technology;
              }
              // If it's a string, look it up in the techMap
              return techMap.get(techName as string);
            })
            .filter((tech): tech is Technology => tech !== undefined)
        }));
      })
    )
    .subscribe({
      next: (projects) => {
        // Sort projects by ID (descending) and take top 3
        const sortedProjects = projects.sort((a, b) => b.id - a.id);
        this.featuredProjects = sortedProjects.slice(0, 3);
        
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading project data:', error);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
