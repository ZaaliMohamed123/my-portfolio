import { ProjectCategory } from './projectCategory.enum';
import { TechCategory } from './techCategory.enum';

export interface ProjectFilters {
  searchTitle: string;
  sortBy: 'latest' | 'oldest' | 'title-asc' | 'title-desc';
  projectCategories: ProjectCategory[];
  techCategories: TechCategory[];
}
