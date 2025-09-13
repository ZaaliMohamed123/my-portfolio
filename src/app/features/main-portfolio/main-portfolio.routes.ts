import { Routes } from '@angular/router';

export const mainPortfolioRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home').then(c => c.Home)
  }
];
