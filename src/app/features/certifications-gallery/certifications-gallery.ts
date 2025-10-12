import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

import {
  Certification,
  CertificationTag,
  CertificationFilters,
  CertificationSortOption,
  CertificationType,
  DEFAULT_CERTIFICATION_FILTERS,
} from '../../core/models';

import { CertificationsService } from '../../core/services/certifications';

@Component({
  selector: 'app-certifications-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslocoModule],
  templateUrl: './certifications-gallery.html',
  styleUrl: './certifications-gallery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificationsGallery implements OnInit, OnDestroy {
  certifications: Certification[] = [];
  filteredCertifications: Certification[] = [];

  filters: CertificationFilters = { ...DEFAULT_CERTIFICATION_FILTERS };

  availableTags: CertificationTag[] = [];
  isTagDropdownOpen = false;

  expandedCert: number | null = null;

  isLoading = true;
  // Dropdown states
  sortDropdownOpen = false;
  typeDropdownOpen = false;
  tagsDropdownOpen = false;

  private destroy$ = new Subject<void>();

  // Sort options for template
  sortOptions: { value: CertificationSortOption; label: string }[] = [
    { value: 'latest', label: 'certificationsGallery.sort.latest' },
    { value: 'oldest', label: 'certificationsGallery.sort.oldest' },
    { value: 'title-asc', label: 'certificationsGallery.sort.titleAsc' },
    { value: 'title-desc', label: 'certificationsGallery.sort.titleDesc' },
  ];

  // Type options for template
  typeOptions: { value: CertificationType; label: string }[] = [
    { value: 'all', label: 'certificationsGallery.type.all' },
    { value: 'standalone', label: 'certificationsGallery.type.standalone' },
    { value: 'skill-track', label: 'certificationsGallery.type.skillTrack' },
  ];

  constructor(
    private certificationsService: CertificationsService,
    private translocoService: TranslocoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.loadCertifications();

    // Reload when language changes
    this.translocoService.langChanges$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadCertifications();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCertifications(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.certificationsService
      .getAllCertifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (certifications) => {
          this.certifications = certifications;
          this.applyFilters();
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading certifications:', error);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });

    // Load available tags
    this.certificationsService
      .getAllTags()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tags) => {
          this.availableTags = tags;
          this.cdr.markForCheck();
        },
      });
  }

  // ========================
  // FILTERS
  // ========================

  applyFilters(): void {
    let filtered = [...this.certifications];

    // Filter by type
    if (this.filters.type !== 'all') {
      filtered = filtered.filter((cert) => cert.type === this.filters.type);
    }

    // Filter by tags
    if (this.filters.tags.length > 0) {
      filtered = filtered.filter((cert) =>
        this.filters.tags.some((tag) => cert.tags.includes(tag))
      );
    }

    // Filter by search
    if (this.filters.search.trim()) {
      const searchLower = this.filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (cert) =>
          cert.title.toLowerCase().includes(searchLower) ||
          cert.description.toLowerCase().includes(searchLower) ||
          cert.provider.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    filtered = this.sortCertifications(filtered, this.filters.sort);

    this.filteredCertifications = filtered;
    this.cdr.markForCheck();
  }

  private sortCertifications(
    certs: Certification[],
    sortBy: CertificationSortOption
  ): Certification[] {
    const sorted = [...certs];

    switch (sortBy) {
      case 'latest':
        return sorted.sort((a, b) => b.id - a.id);
      case 'oldest':
        return sorted.sort((a, b) => a.id - b.id);
      case 'title-asc':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'title-desc':
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return sorted;
    }
  }

  onSortChange(): void {
    this.closeAllDropdowns(); // Fermer le dropdown après sélection
    this.applyFilters();
  }

  onTypeChange(): void {
    this.closeAllDropdowns(); // Fermer le dropdown après sélection
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  toggleTag(tag: CertificationTag): void {
    const index = this.filters.tags.indexOf(tag);
    if (index > -1) {
      this.filters.tags.splice(index, 1);
    } else {
      this.filters.tags.push(tag);
    }
    this.applyFilters();
  }

  isTagSelected(tag: CertificationTag): boolean {
    return this.filters.tags.includes(tag);
  }

  clearAllTags(): void {
    this.filters.tags = [];
    this.applyFilters();
  }

  clearAllFilters(): void {
  // Créer un nouvel objet au lieu de réutiliser la référence
  this.filters = {
    sort: 'latest',
    tags: [],
    type: 'all',
    search: ''
  };
  
  this.closeAllDropdowns();
  this.applyFilters();
  
  // Force la détection des changements
  this.cdr.detectChanges();
}
  // ========================
  // CERTIFICATION ACTIONS
  // ========================

  toggleCertification(certId: number): void {
    if (this.expandedCert === certId) {
      this.expandedCert = null;
    } else {
      this.expandedCert = certId;
    }
    this.cdr.detectChanges();
  }

  openCredential(url: string, event: Event): void {
    event.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  getProviderClass(provider: string): string {
    return provider.toLowerCase().replace(/\s+/g, '-');
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  trackCertification(index: number, certification: Certification): number {
    return certification.id;
  }

  // ========================
  // DROPDOWN MANAGEMENT
  // ========================

  toggleDropdown(type: 'sort' | 'type' | 'tags'): void {
    switch (type) {
      case 'sort':
        this.sortDropdownOpen = !this.sortDropdownOpen;
        this.typeDropdownOpen = false;
        this.tagsDropdownOpen = false;
        break;
      case 'type':
        this.typeDropdownOpen = !this.typeDropdownOpen;
        this.sortDropdownOpen = false;
        this.tagsDropdownOpen = false;
        break;
      case 'tags':
        this.tagsDropdownOpen = !this.tagsDropdownOpen;
        this.sortDropdownOpen = false;
        this.typeDropdownOpen = false;
        break;
    }
    this.cdr.markForCheck();
  }

  closeAllDropdowns(): void {
    this.sortDropdownOpen = false;
    this.typeDropdownOpen = false;
    this.tagsDropdownOpen = false;
    this.cdr.markForCheck();
  }

  // ========================
  // SORT DROPDOWN
  // ========================

  selectSort(value: CertificationSortOption): void {
    this.filters.sort = value;
    this.sortDropdownOpen = false;
    this.applyFilters();
  }

  getSortLabel(): string {
    const option = this.sortOptions.find((opt) => opt.value === this.filters.sort);
    return option ? option.label : this.sortOptions[0].label;
  }

  // ========================
  // TYPE DROPDOWN
  // ========================

  selectType(value: CertificationType): void {
    this.filters.type = value;
    this.typeDropdownOpen = false;
    this.applyFilters();
  }

  getTypeLabel(): string {
    const option = this.typeOptions.find((opt) => opt.value === this.filters.type);
    return option ? option.label : this.typeOptions[0].label;
  }

  // ========================
  // TAGS DROPDOWN (modifier le nom de la méthode)
  // ========================

  toggleTagDropdown(): void {
    this.toggleDropdown('tags');
  }

  closeTagDropdown(): void {
    this.tagsDropdownOpen = false;
    this.cdr.markForCheck();
  }

  hasActiveFilters(): boolean {
    return (
      this.filters.tags.length > 0 ||
      this.filters.type !== 'all' ||
      this.filters.search.trim() !== '' ||
      this.filters.sort !== 'latest' // Ajouter cette condition
    );
  }
}
