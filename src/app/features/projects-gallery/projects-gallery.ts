import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule,Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Project, ProjectFilters, ProjectCategory, TechCategory } from '../../core/models';
import { ProjectsService } from '../../core/services/projects.service';

@Component({
  selector: 'app-projects-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslocoModule],
  templateUrl: './projects-gallery.html',
  styleUrl: './projects-gallery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsGallery implements OnInit, OnDestroy {
  // Component State
  allProjects: Project[] = [];
  filteredProjects: Project[] = [];
  isLoading = true;
  categoryDropdownOpen = false;
  techDropdownOpen = false;

  // Filters
  filters: ProjectFilters = {
    searchTitle: '',
    sortBy: 'latest',
    projectCategories: [],
    techCategories: [],
  };

  // Enums for template
  projectCategoryEnum = ProjectCategory;
  techCategoryEnum = TechCategory;

  // Dropdown options
  projectCategories = Object.values(ProjectCategory);
  techCategories = Object.values(TechCategory);
  sortOptions = [
    { value: 'latest', label: 'projectsGallery.sort.latest' },
    { value: 'oldest', label: 'projectsGallery.sort.oldest' },
    { value: 'title-asc', label: 'projectsGallery.sort.titleAsc' },
    { value: 'title-desc', label: 'projectsGallery.sort.titleDesc' },
  ];

  // Lifecycle Management
  private destroy$ = new Subject<void>();

  constructor(
    private projectsService: ProjectsService,
    private translocoService: TranslocoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Scroll to top quand on arrive sur la page
    window.scrollTo(0, 0);
    this.loadProjects();

    // Reload when language changes
    this.translocoService.langChanges$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadProjects();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all projects
   */
  private loadProjects(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.projectsService
      .loadAllData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.allProjects = data.projects;
          this.applyFilters();
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading projects:', error);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Apply current filters
   */
  applyFilters(): void {
    this.filteredProjects = this.projectsService.filterProjects(this.filters);
    this.cdr.markForCheck();
  }

  /**
   * Toggle project category filter
   */
  toggleProjectCategory(category: ProjectCategory): void {
    const index = this.filters.projectCategories.indexOf(category);
    if (index > -1) {
      this.filters.projectCategories.splice(index, 1);
    } else {
      this.filters.projectCategories.push(category);
    }
    this.applyFilters();
  }

  /**
   * Toggle tech category filter
   */
  toggleTechCategory(category: TechCategory): void {
    const index = this.filters.techCategories.indexOf(category);
    if (index > -1) {
      this.filters.techCategories.splice(index, 1);
    } else {
      this.filters.techCategories.push(category);
    }
    this.applyFilters();
  }

  /**
   * Check if project category is selected
   */
  isProjectCategorySelected(category: ProjectCategory): boolean {
    return this.filters.projectCategories.includes(category);
  }

  /**
   * Check if tech category is selected
   */
  isTechCategorySelected(category: TechCategory): boolean {
    return this.filters.techCategories.includes(category);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filters = {
      searchTitle: '',
      sortBy: 'latest',
      projectCategories: [],
      techCategories: [],
    };
    this.applyFilters();
  }

  // Add these methods
  toggleDropdown(type: 'category' | 'tech'): void {
    if (type === 'category') {
      this.categoryDropdownOpen = !this.categoryDropdownOpen;
      this.techDropdownOpen = false;
    } else {
      this.techDropdownOpen = !this.techDropdownOpen;
      this.categoryDropdownOpen = false;
    }
    this.cdr.markForCheck();
  }

  hasActiveFilters(): boolean {
    return (
      this.filters.searchTitle.trim() !== '' ||
      this.filters.projectCategories.length > 0 ||
      this.filters.techCategories.length > 0 ||
      this.filters.sortBy !== 'latest'
    );
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }
}
