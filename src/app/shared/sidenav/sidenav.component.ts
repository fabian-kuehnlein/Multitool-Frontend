import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-sidenav',
  imports: [
    MatDialogModule,
    MatSidenavModule,
    MatListModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss'
})
export class SidenavComponent {
    private readonly router = inject(Router);
    private readonly dialogData = inject(MAT_DIALOG_DATA) as string;

    public readonly tools = [
        {
            title: 'Kalender',
            icon: 'event',
            route: '/calendar',
        },
        {
            title: 'Custom Tables',
            icon: 'list',
            route: '/custom-table',
        }
    ];

    navigate(route: string) {
        this.router.navigate([route])
    }

    isCurrentRoute(route: string) {
        return `/${this.dialogData}` === route;
    }
}
