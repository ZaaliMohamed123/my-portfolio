import { Technology } from './technology.model';
import { ProjectCategory } from './projectCategory.enum';


export interface Project {
  id: number; 
  title: string;
  subtitle: string;
  description: string;
  longDescription?: string;

  // Visual Assets
  logo: string | string[]; // Can be a single logo or an array of logos
  thumbnail?: string;
  images: string[];
  videoTuto:string;
  demoGif?: string;

  // Technology & Tools
  technologies: Technology[];
  categories: ProjectCategory[];

  // Links & Actions
  github: string;
  goToPage: string; // Route to project detail page
}








