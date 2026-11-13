import {
    Component,
    Input,
    ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import { MonthHoCount } from '../../../models/work-time-planner.model';
import { isHomeOfficeLimitExceeded } from '../../../logic/home-office-limit.logic';
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
    @Input() homeOfficeLimitMonthly = 0;
    @Input() isHomeOfficeWeeklyLimitExceeded = false;
    @Input() homeOfficeMonthCounts: MonthHoCount[] = [];

    readonly formatMinutes = formatMinutes;

    isMonthOverLimit(month: MonthHoCount): boolean {
        return isHomeOfficeLimitExceeded(
            month.count,
            this.homeOfficeLimitMonthly,
        );
    }
}
