import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import { formatMinutes } from '../../../utilities/work-time.util';

@Component({
    selector: 'app-overtime-summary',
    standalone: true,
    imports: [CommonModule, UI_MODULES],
    templateUrl: './overtime-summary.component.html',
    styleUrl: './overtime-summary.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class OvertimeSummaryComponent {
    @Input() weeklyOvertimeMinutes = 0;
    @Input() totalOvertime = 0;

    readonly formatMinutes = formatMinutes;
}
