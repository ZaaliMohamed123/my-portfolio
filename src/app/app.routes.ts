import { Routes } from '@angular/router';
import { ProjectsGallery } from './features/projects-gallery/projects-gallery';
import { ProjectDetail } from './features/project-detail/project-detail';
import {CertificationsGallery} from './features/certifications-gallery/certifications-gallery';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout').then(c => c.MainLayout),
    title: 'Mohamed ZAALI - Portfolio',
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
    title: 'Projects Gallery'
  },
  {
  path: 'projects/:id',
  component: ProjectDetail,
  title: 'Project Details'
  },
  {
    path: 'certifications-gallery',
    component: CertificationsGallery,
    title: 'Certifications Gallery'
  }
];
