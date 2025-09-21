import { ProjectCategory } from './projectCategory.enum';

export interface ProjectFilters {
  searchTerm: string;
  sortBy: 'latest' | 'oldest' | 'title-asc' | 'title-desc';
  categories: ProjectCategory[];
  categoryFilterMode: 'any' | 'all'; 
  technologies: string[];
}