import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslocoService } from '@jsverse/transloco';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { Project, Technology, ProjectFilters } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private allProjects: Project[] = [];
  private allTechnologies: Technology[] = [];

  constructor(private http: HttpClient, private translocoService: TranslocoService) {}

  /**
   * Load all projects and technologies
   */
  loadAllData(): Observable<{ projects: Project[]; technologies: Technology[] }> {
    const currentLang = this.translocoService.getActiveLang();
    const projectsPath = `assets/data/projects.${currentLang}.json`;
    const technologiesPath = `assets/data/technologies.json`;

    return forkJoin({
      projects: this.http.get<Project[]>(projectsPath).pipe(
        catchError((error) => {
          console.error('Error loading projects:', error);
          return of([]);
        })
      ),
      technologies: this.http.get<Technology[]>(technologiesPath).pipe(
        catchError((error) => {
          console.error('Error loading technologies:', error);
          return of([]);
        })
      ),
    }).pipe(
      map((data) => {
        // Map technology names to full Technology objects
        const techMap = new Map(data.technologies.map((tech) => [tech.name, tech]));

        const mappedProjects = data.projects.map((project) => ({
          ...project,
          technologies: project.technologies
            .map((techName) => {
              if (typeof techName === 'object' && 'name' in techName) {
                return techName as Technology;
              }
              return techMap.get(techName as string);
            })
            .filter((tech): tech is Technology => tech !== undefined),
        }));

        this.allProjects = mappedProjects;
        this.allTechnologies = data.technologies;

        return { projects: mappedProjects, technologies: data.technologies };
      })
    );
  }

  /**
   * Get all projects
   * Returns an Observable that loads data if not already loaded
   */
  getAllProjects(): Observable<Project[]> {
    // If projects are already loaded, return them
    if (this.allProjects.length > 0) {
      return of(this.allProjects);
    }

    // Otherwise, load data first
    return this.loadAllData().pipe(
      map(data => data.projects)
    );
  }

  /**
   * Get all technologies
   */
  getAllTechnologies(): Technology[] {
    return this.allTechnologies;
  }

  /**
   * Filter and sort projects based on filters
   */
  filterProjects(filters: ProjectFilters): Project[] {
    let filtered = [...this.allProjects];

    // Filter by search title
    if (filters.searchTitle.trim()) {
      const searchLower = filters.searchTitle.toLowerCase().trim();
      filtered = filtered.filter((project) => project.title.toLowerCase().includes(searchLower));
    }

    // Filter by project categories
    if (filters.projectCategories.length > 0) {
      filtered = filtered.filter((project) =>
        project.categories.some((cat) => filters.projectCategories.includes(cat))
      );
    }

    // Filter by tech categories
    if (filters.techCategories.length > 0) {
      filtered = filtered.filter((project) =>
        project.technologies.some((tech) => filters.techCategories.includes(tech.category))
      );
    }

    // Sort projects
    filtered = this.sortProjects(filtered, filters.sortBy);

    return filtered;
  }

  /**
   * Sort projects based on sort option
   */
  private sortProjects(projects: Project[], sortBy: ProjectFilters['sortBy']): Project[] {
    switch (sortBy) {
      case 'latest':
        return projects.sort((a, b) => b.id - a.id);
      case 'oldest':
        return projects.sort((a, b) => a.id - b.id);
      case 'title-asc':
        return projects.sort((a, b) => a.title.localeCompare(b.title));
      case 'title-desc':
        return projects.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return projects;
    }
  }
}
