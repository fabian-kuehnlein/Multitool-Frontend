import {
    Component,
    inject,
    OnInit,
    OnDestroy,
    ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { UI_MODULES } from '../../../shared/utilities/material-ui';
import { WorkTimePlannerService } from '../services/work-time-planner.service';
import { DayCardComponent } from './components/day-card/day-card.component';
import { SettingsDialogComponent } from './components/settings-dialog/settings-dialog.component';
import { OvertimeSummaryComponent } from './components/overtime-summary/overtime-summary.component';
import { WeekSummaryComponent } from './components/week-summary/week-summary.component';
import { PlannerSidebarComponent } from './components/planner-sidebar/planner-sidebar.component';
import { SidenavComponent } from '../../../core/layout/sidenav/sidenav.component';
import { MediaService } from '../../../core/services/media.service';
import { HotkeyService, Hotkeys } from '../../../core/services/hotkey.service';
import { WEEKDAY_NAMES } from '../utilities/work-time.config';

@Component({
    selector: 'app-work-time-planner',
    standalone: true,
    imports: [
        CommonModule,
        UI_MODULES,
        DayCardComponent,
        OvertimeSummaryComponent,
        WeekSummaryComponent,
        PlannerSidebarComponent,
    ],
    templateUrl: './work-time-planner.component.html',
    styleUrl: './work-time-planner.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class WorkTimePlannerComponent implements OnInit, OnDestroy {
    protected readonly plannerService = inject(WorkTimePlannerService);
    private readonly dialog = inject(MatDialog);
    private readonly media = inject(MediaService);
    private readonly hotkeyService = inject(HotkeyService);
    private readonly hotkeyUnsubscribers: Array<() => void> = [];

    readonly isMobile = this.media.isMobile;
    readonly isTablet = this.media.isTablet;
    readonly isLaptop = this.media.isLaptop;
    readonly isDesktop = this.media.isDesktop;

    ngOnInit(): void {
        this.plannerService.loadSettings();
        this.plannerService.loadWorkDays();
        this.hotkeyUnsubscribers.push(
            this.hotkeyService.register({
                id: 'work-time-planner.previous',
                combo: Hotkeys.prevPage,
                description: 'Vorherige Woche',
                action: () => this.plannerService.navigateWeek('prev'),
            }),
            this.hotkeyService.register({
                id: 'work-time-planner.next',
                combo: Hotkeys.nextPage,
                description: 'Nächste Woche',
                action: () => this.plannerService.navigateWeek('next'),
            }),
        );
    }

    ngOnDestroy(): void {
        this.hotkeyUnsubscribers.forEach((unsubscribe) => unsubscribe());
    }

    openSideNav(): void {
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

    openSettings(): void {
        this.dialog.open(SettingsDialogComponent, {
            width: this.isMobile() ? '100vw' : '480px',
            height: this.isMobile() ? '100vh' : 'auto',
            minWidth: this.isMobile() ? '100vw' : 'unset',
            maxWidth: this.isMobile() ? '100vw' : '95vw',
            panelClass: this.isMobile() ? 'full-screen-dialog' : '',
        });
    }

    getDayName(index: number): string {
        return WEEKDAY_NAMES[index] ?? '';
    }
}
