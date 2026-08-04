import {
    Component,
    Input,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import { MonthHoCount } from '../../../models/work-time-planner.model';
import { formatMinutes } from '../../../utilities/work-time.util';

@Component({
    selector: 'app-planner-sidebar',
    standalone: true,
    imports: [CommonModule, UI_MODULES],
    templateUrl: './planner-sidebar.component.html',
    styleUrl: './planner-sidebar.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class PlannerSidebarComponent {
    @Input() weekNumber = 0;
    @Input() weeklyWorkMinutes = 0;
    @Input() weeklyOvertimeMinutes = 0;
    @Input() baseOvertime = 0;
    @Input() totalOvertime = 0;
    @Input() homeOfficeDaysThisWeek = 0;
    @Input() homeOfficeMonthCounts: MonthHoCount[] = [];
    @Output() openSettings = new EventEmitter<void>();

    readonly formatMinutes = formatMinutes;
}
