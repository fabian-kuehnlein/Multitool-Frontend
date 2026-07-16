import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
    },
    {
        path: 'login',
        loadComponent: () =>
            import('./core/auth/pages/login/login.component').then(
                (m) => m.LoginComponent,
            ),
    },
    {
        path: 'calendar',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./modules/calendar/pages/calendar.component').then(
                (m) => m.CalendarComponent,
            ),
    },
    {
        path: 'custom-table',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./modules/custom-table/pages/custom-table.component').then(
                (m) => m.CustomTableComponent,
            ),
    },
    {
        path: 'todo',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./modules/todo/pages/todo.component').then(
                (m) => m.TodoComponent,
            ),
    },
    {
        path: 'work-time-planner',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./modules/work-time-planner/pages/work-time-planner.component').then(
                (m) => m.WorkTimePlannerComponent,
            ),
    },
];
