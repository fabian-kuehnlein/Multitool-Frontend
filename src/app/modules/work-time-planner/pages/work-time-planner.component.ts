import {
    Component,
    inject,
    OnInit,
    ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { UI_MODULES } from '../../../shared/utilities/material-ui';
import { WorkTimePlannerService } from '../services/work-time-planner.service';
import { DayCardComponent } from './components/day-card/day-card.component';
import { SettingsDialogComponent } from './components/settings-dialog/settings-dialog.component';
import { SidenavComponent } from '../../../core/layout/sidenav/sidenav.component';
import { MediaService } from '../../../core/services/media.service';

@Component({
    selector: 'app-work-time-planner',
    standalone: true,
    imports: [CommonModule, UI_MODULES, DayCardComponent],
    templateUrl: './work-time-planner.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './work-time-planner.component.scss',
})
export class WorkTimePlannerComponent implements OnInit {
    protected readonly plannerService = inject(WorkTimePlannerService);
    private readonly dialog = inject(MatDialog);
    private readonly media = inject(MediaService);

    readonly isMobile = this.media.isMobile;
    readonly isTablet = this.media.isTablet;
    readonly isDesktop = this.media.isDesktop;

    constructor() {}

    ngOnInit(): void {
        this.plannerService.loadWorkDays();
    }

    openSideNav() {
        this.dialog.open(SidenavComponent, {
            position: this.isMobile()
                ? { bottom: '120px' }
                : { top: '90px', left: '30px' },
            width: this.isMobile() ? '90vw' : 'auto',
            height: 'auto',
            hasBackdrop: true,
            backdropClass: 'transparent-backdrop',
            data: 'work-time-planner',
        });
    }

    openSettings() {
        this.dialog.open(SettingsDialogComponent, {
            width: this.isMobile() ? '100vw' : '480px',
            height: this.isMobile() ? '100vh' : 'auto',
            minWidth: this.isMobile() ? '100vw' : 'unset',
            maxWidth: this.isMobile() ? '100vw' : '95vw',
            panelClass: this.isMobile() ? 'full-screen-dialog' : '',
        });
    }

    getDayName(index: number): string {
        return (
            ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'][
                index
            ] || ''
        );
    }

    formatMinutes(minutes: number): string {
        const h = Math.floor(Math.abs(minutes) / 60);
        const m = Math.abs(minutes) % 60;
        const sign = minutes < 0 ? '-' : '';
        return `${sign}${h}h ${m.toString().padStart(2, '0')}min`;
    }
}
