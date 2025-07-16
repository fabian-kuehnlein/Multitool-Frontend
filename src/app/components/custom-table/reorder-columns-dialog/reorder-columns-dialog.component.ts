import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs'

@Component({
  selector: 'app-reorder-columns-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    DragDropModule,
    MatCardModule,
    MatTabsModule
  ],
  templateUrl: './reorder-columns-dialog.component.html',
  styleUrl: './reorder-columns-dialog.component.scss'
})
export class ReorderColumnsDialogComponent {
    public columns: any[];


    constructor(
        private dialogRef: MatDialogRef<ReorderColumnsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { columns: string[] }
    ) {
        this.columns = [...data.columns];
    }

    drop(event: CdkDragDrop<string[]>) {}

    save() {}

    cancel() {}
}
