import { ProjectCategory } from './projectCategory.enum';
import { TechCategory } from './techCategory.enum';

export type ProjectSortOption = 'latest' | 'oldest' | 'title-asc' | 'title-desc';

export interface ProjectFilters {
  searchTitle: string;
  sortBy: ProjectSortOption;
  projectCategories: ProjectCategory[];
  techCategories: TechCategory[];
}

export const DEFAULT_PROJECT_FILTERS: ProjectFilters = {
  searchTitle: '',
  sortBy: 'latest',
  projectCategories: [],
  techCategories: []
};

