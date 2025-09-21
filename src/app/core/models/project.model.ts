import { Technology } from './technology.model';
import { ProjectCategory } from './projectCategory.enum';


export interface Project {
  id: number; 
  title: string;
  subtitle: string;
  description: string;
  longDescription?: string;

  // Visual Assets
  thumbnail: string;
  images: string[];
  demoGif?: string;

  // Technology & Tools
  technologies: Technology[];
  categories: ProjectCategory[];

  // Links & Actions
  github: string;
  goToPage: string; // Route to project detail page
}








