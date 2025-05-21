import { ApplicationConfig, ApplicationRef, Component, computed } from '@angular/core';
import { Routes, provideRouter, withDebugTracing } from '@angular/router';
import { CalendarComponent } from './components1/calendar/calendar.component';

export const routes: Routes = [
  {path: '', component: CalendarComponent}
];

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes, withDebugTracing())]
}