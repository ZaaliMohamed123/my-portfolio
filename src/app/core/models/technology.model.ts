import { TechCategory } from './techCategory.enum';

export interface Technology {
  name: string;
  icon: string;
  color: string;
  category: TechCategory;
  isCustomIcon?: boolean;
}