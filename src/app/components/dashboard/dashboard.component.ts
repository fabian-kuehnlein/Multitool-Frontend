import { Component, inject } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { UI_MODULES } from '../../shared/material-ui';
import { Router } from '@angular/router';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    UI_MODULES,
    MatGridListModule,
    MatCardModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
    private readonly router = inject(Router);
    private readonly dashboardService = inject(DashboardService)

    public readonly tools = this.dashboardService.getTools();

    goTo(route: string) {
        this.router.navigate([route]);
    }
}
