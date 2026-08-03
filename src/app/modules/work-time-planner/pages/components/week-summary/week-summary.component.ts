import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import { formatMinutes } from '../../../utilities/work-time.util';

@Component({
    selector: 'app-week-summary',
    standalone: true,
    imports: [CommonModule, UI_MODULES],
    templateUrl: './week-summary.component.html',
    styleUrl: './week-summary.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class WeekSummaryComponent {
    @Input() weeklyTargetMinutes = 0;
    @Input() weeklyWorkMinutes = 0;
    @Input() weeklyOvertimeMinutes = 0;
    @Input() baseOvertime = 0;
    @Input() totalOvertime = 0;
    @Input() compact = false;

    readonly formatMinutes = formatMinutes;
}
