import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Project, ProjectFilters, ProjectCategory, TechCategory, ProjectSortOption } from '../../core/models';
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
  
  // Dropdown states
  sortDropdownOpen = false;
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
  sortOptions: { value: ProjectSortOption; label: string }[] = [
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

  // ========================
  // PROJECTS LOADING
  // ========================

  /**
   * Load all projects
   */
  private loadProjects(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.projectsService
      .getAllProjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (projects: Project[]) => {
          this.allProjects = projects;
          this.applyFilters();
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: Error) => {
          console.error('Error loading projects:', error);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  // ========================
  // FILTERS
  // ========================

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

  /**
   * Check if there are active filters
   */
  hasActiveFilters(): boolean {
    return (
      this.filters.searchTitle.trim() !== '' ||
      this.filters.projectCategories.length > 0 ||
      this.filters.techCategories.length > 0 ||
      this.filters.sortBy !== 'latest'
    );
  }

  // ========================
  // DROPDOWN MANAGEMENT
  // ========================

  /**
   * Toggle dropdown visibility
   */
  toggleDropdown(type: 'sort' | 'category' | 'tech'): void {
    switch (type) {
      case 'sort':
        this.sortDropdownOpen = !this.sortDropdownOpen;
        this.categoryDropdownOpen = false;
        this.techDropdownOpen = false;
        break;
      case 'category':
        this.categoryDropdownOpen = !this.categoryDropdownOpen;
        this.sortDropdownOpen = false;
        this.techDropdownOpen = false;
        break;
      case 'tech':
        this.techDropdownOpen = !this.techDropdownOpen;
        this.sortDropdownOpen = false;
        this.categoryDropdownOpen = false;
        break;
    }
    this.cdr.markForCheck();
  }

  /**
   * Close all dropdowns
   */
  closeAllDropdowns(): void {
    this.sortDropdownOpen = false;
    this.categoryDropdownOpen = false;
    this.techDropdownOpen = false;
    this.cdr.markForCheck();
  }

  // ========================
  // SORT DROPDOWN
  // ========================

  /**
   * Select sort option
   */
  selectSort(value: ProjectSortOption): void {
    this.filters.sortBy = value;
    this.sortDropdownOpen = false;
    this.applyFilters();
  }

  /**
   * Get current sort label
   */
  getSortLabel(): string {
    const option = this.sortOptions.find(opt => opt.value === this.filters.sortBy);
    return option ? option.label : this.sortOptions[0].label;
  }

  // ========================
  // NAVIGATION
  // ========================

  /**
   * Navigate to home page
   */
  goToHome(): void {
    this.router.navigate(['/']);
  }
}
