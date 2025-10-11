import { Routes } from '@angular/router';
import { ProjectsGallery } from './features/projects-gallery/projects-gallery';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout').then(c => c.MainLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/main-portfolio/main-portfolio').then(c => c.MainPortfolio)
      }
    ]
  },
  {
    path: 'projects-gallery',
    component: ProjectsGallery,
    title: 'Projects Gallery | Mohamed ZAALI'
  }
];
