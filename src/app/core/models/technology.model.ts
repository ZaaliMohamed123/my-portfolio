import { Tech } from './tech.enum';

export interface Technology {
  name: string;
  icon: string;
  color: string;
  technology: Tech;
  isCustomIcon?: boolean;
}