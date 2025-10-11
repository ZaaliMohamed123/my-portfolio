import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { TranslocoService } from '@jsverse/transloco';

import { Certification, CertificationTag } from '../models';

interface CertificationsData {
  certifications: Certification[];
}

@Injectable({
  providedIn: 'root'
})
export class CertificationsService {
  
  private cache$ = new Map<string, Observable<CertificationsData>>();

  constructor(
    private http: HttpClient,
    private translocoService: TranslocoService
  ) {}

  /**
   * Load all certifications data based on current language
   */
  loadAllData(): Observable<CertificationsData> {
    const currentLang = this.translocoService.getActiveLang();
    
    // Return cached data if available
    if (this.cache$.has(currentLang)) {
      return this.cache$.get(currentLang)!;
    }

    const certifications$ = this.loadCertifications(currentLang).pipe(
      catchError(error => {
        console.error('Error loading certifications:', error);
        return of([]);
      })
    );

    const data$ = certifications$.pipe(
      map(certifications => ({ certifications })),
      shareReplay(1)
    );

    this.cache$.set(currentLang, data$);
    return data$;
  }

  /**
   * Load certifications from JSON file
   */
  private loadCertifications(lang: string): Observable<Certification[]> {
    return this.http.get<Certification[]>(`/assets/data/certifications.${lang}.json`);
  }

  /**
   * Get the latest N certifications (for main page)
   */
  getLatestCertifications(count: number = 3): Observable<Certification[]> {
    return this.loadAllData().pipe(
      map(data => {
        // Sort by ID (descending) to get latest first
        const sorted = [...data.certifications].sort((a, b) => b.id - a.id);
        return sorted.slice(0, count);
      })
    );
  }

  /**
   * Get all certifications (for gallery page)
   */
  getAllCertifications(): Observable<Certification[]> {
    return this.loadAllData().pipe(
      map(data => {
        // Sort by ID (descending) to get latest first
        return [...data.certifications].sort((a, b) => b.id - a.id);
      })
    );
  }

  /**
   * Get certification by ID
   */
  getCertificationById(id: number): Observable<Certification | null> {
    return this.loadAllData().pipe(
      map(data => data.certifications.find(cert => cert.id === id) || null)
    );
  }

  /**
   * Filter certifications by tag
   */
  filterCertificationsByTag(tag: CertificationTag | null): Observable<Certification[]> {
    return this.getAllCertifications().pipe(
      map(certifications => {
        if (!tag) {
          return certifications;
        }
        return certifications.filter(cert => cert.tags.includes(tag));
      })
    );
  }

  /**
   * Get all unique tags from certifications
   */
  getAllTags(): Observable<CertificationTag[]> {
    return this.loadAllData().pipe(
      map(data => {
        const tagsSet = new Set<CertificationTag>();
        data.certifications.forEach(cert => {
          cert.tags.forEach(tag => tagsSet.add(tag));
        });
        return Array.from(tagsSet).sort();
      })
    );
  }

  /**
   * Get certification count by tag
   */
  getCertificationCountByTag(): Observable<Map<CertificationTag, number>> {
    return this.loadAllData().pipe(
      map(data => {
        const countMap = new Map<CertificationTag, number>();
        data.certifications.forEach(cert => {
          cert.tags.forEach(tag => {
            countMap.set(tag, (countMap.get(tag) || 0) + 1);
          });
        });
        return countMap;
      })
    );
  }

  /**
   * Clear cache (useful when language changes)
   */
  clearCache(): void {
    this.cache$.clear();
  }
}
