import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './confirm-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<ConfirmDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
    ) {}

    get title() { return this.data?.title || 'Bist du dir sicher?'; }
    get message() { return this.data?.message || 'Möchten Sie diesen Vorgang wirklich fortfahren?'; }
    get confirmText() { return this.data?.confirmText || 'Bestätigen'; }
    get cancelText() { return this.data?.cancelText || 'Abbrechen'; }
    get isDestructive() { return this.data?.isDestructive ?? true; }
}
