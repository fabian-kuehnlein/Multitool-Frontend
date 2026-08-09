import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';

@Component({
    selector: 'app-recurrence-choice-dialog',
    standalone: true,
    imports: [UI_MODULES],
    templateUrl: './recurrence-choice-dialog.component.html',
    styleUrl: './recurrence-choice-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class RecurrenceChoiceDialogComponent {
    private readonly dialogRef = inject(
        MatDialogRef<RecurrenceChoiceDialogComponent>,
    );

    onChoice(choice: 'instance' | 'series') {
        this.dialogRef.close(choice);
    }

    onCancel() {
        this.dialogRef.close(null);
    }
}
