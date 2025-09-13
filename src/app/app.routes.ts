import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/main-portfolio/main-portfolio.routes').then(r => r.mainPortfolioRoutes)
  },
  {
    path: 'projects',
    loadComponent: () => import('./features/projects-gallery/components/projects-list/projects-list').then(c => c.ProjectsList)
  },
  {
    path: 'project/:category/:id',
    loadComponent: () => import('./features/project-showcase/components/ai-projects/ai-project-detail/ai-project-detail').then(c => c.AiProjectDetail)
  }
];
