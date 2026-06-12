import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../auth/services/auth.service';
import { MatDividerModule } from '@angular/material/divider';

@Component({
    selector: 'app-sidenav',
    standalone: true,
    imports: [MatIconModule, MatSidenavModule, MatListModule, MatDividerModule],
    templateUrl: './sidenav.component.html',
    styleUrl: './sidenav.component.scss'
})
export class SidenavComponent {
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);
    private readonly dialogRef = inject(MatDialogRef<SidenavComponent>);
    public readonly dialogData = inject(MAT_DIALOG_DATA);

    tools = [
        {
            name: 'Kalender',
            description: 'Termine verwalten',
            icon: 'calendar_today',
            route: '/calendar',
        },
        {
            name: 'Tabellen',
            description: 'Eigene Listen führen',
            icon: 'table_chart',
            route: '/custom-table',
        },
        {
            name: 'Todos',
            description: 'Aufgaben organisieren',
            icon: 'check_circle',
            route: '/todo',
        }
    ];

    navigate(route: string) {
        this.router.navigate([route]);
        this.dialogRef.close();
    }

    logout() {
        this.authService.logout();
        this.dialogRef.close();
    }

    isCurrentRoute(route: string) {
        return `/${this.dialogData}` === route;
    }
}
