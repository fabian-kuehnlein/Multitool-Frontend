import { Routes } from '@angular/router';
import { authGuard } from './shared/authentication/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'calendar',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  { 
    path: 'calendar',
    canActivate: [authGuard],
    loadComponent: () => import('./components/calendar/calendar.component').then(m => m.CalendarComponent)
  },
  {
    path: 'custom-table',
    canActivate: [authGuard],
    loadComponent: () => import('./components/custom-table/custom-table.component').then(m => m.CustomTableComponent)
  }
];