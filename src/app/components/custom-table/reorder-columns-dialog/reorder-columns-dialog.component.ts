import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { UpdateColumnOrderDto } from '../models/TableMetadata';

@Component({
  selector: 'app-reorder-columns-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    DragDropModule
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

    drop(event: CdkDragDrop<string[]>) {
        if (event.previousIndex === event.currentIndex) return;
        
        moveItemInArray(this.columns, event.previousIndex, event.currentIndex);
    }

    save() {
        const dto: UpdateColumnOrderDto[] = this.columns.map((col, index) => ({
            columnId: col.colId,
            colOrder: index
        }));

        this.dialogRef.close(dto);
    }

    cancel() {
        this.dialogRef.close(null);
    }
}
