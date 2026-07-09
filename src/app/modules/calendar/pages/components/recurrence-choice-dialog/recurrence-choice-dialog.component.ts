import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-recurrence-choice-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
        <mat-icon color="primary">event_repeat</mat-icon>
        Wiederkehrendes Event
    </h2>
    <mat-dialog-content>
        <p>Dies ist ein Teil einer Serie. Was möchtest du bearbeiten?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Abbrechen</button>
        <button mat-stroked-button color="primary" (click)="onChoice('instance')">Nur diesen Termin</button>
        <button mat-flat-button color="primary" (click)="onChoice('series')">Die gesamte Serie</button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .dialog-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
    }
    mat-dialog-content {
        padding-top: 10px;
    }
    mat-dialog-actions {
        padding: 16px 24px;
        gap: 8px;
    }
  `]
})
export class RecurrenceChoiceDialogComponent {
  constructor(private dialogRef: MatDialogRef<RecurrenceChoiceDialogComponent>) {}

  onChoice(choice: 'instance' | 'series') {
    this.dialogRef.close(choice);
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
