import { ApplicationConfig } from '@angular/core';
import { Routes, provideRouter, withDebugTracing } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  { 
    path: 'calendar',
    loadComponent: () => import('./components/calendar/calendar.component').then(m => m.CalendarComponent)
  },
  // {
  //   path: 'custom-tables',
  //   loadComponent: () => import('./components/custom-table/custom-table.component').then(m => m.CustomTableComponent)
  // }
  // {
  //   path: 'to-do'
  // }
];

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes, withDebugTracing())]
}