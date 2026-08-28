import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { UI_MODULES } from '../../utilities/material-ui';
import {
    RecurrenceFrequency,
    weekdayOptions,
    frequencyLabels,
} from '../../utilities/recurrence.config';

@Component({
    selector: 'app-recurrence-form',
    standalone: true,
    imports: [UI_MODULES, NgClass],
    templateUrl: './recurrence-form.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './recurrence-form.component.scss',
})
export class RecurrenceFormComponent {
    public readonly parentForm = input.required<FormGroup>();

    protected readonly weekdayOptions = weekdayOptions;

    protected readonly frequency = computed(() =>
        this.parentForm().get('recurrenceFrequency')?.value as string,
    );

    protected readonly getFrequencyLabel = computed(() => {
        const freq = this.frequency();
        return freq
            ? (frequencyLabels[freq as RecurrenceFrequency] ?? '')
            : '';
    });

    protected readonly firstSelectedWeekdayLabel = computed(() => {
        const byDay = this.parentForm().get('recurrenceByDay')?.value as
            | string[]
            | undefined;
        const firstSelected = byDay?.[0];
        return (
            this.weekdayOptions.find((d) => d.value === firstSelected)?.label ||
            ''
        );
    });

    protected changeInterval(delta: number): void {
        const control = this.parentForm().get('recurrenceInterval');
        const currentValue = control?.value || 1;
        control?.setValue(Math.max(1, currentValue + delta));
    }
}
