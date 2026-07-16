import {
    CdkDragDrop,
    DragDropModule,
    moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UpdateColumnOrderDto } from '../../../models';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';

@Component({
    selector: 'app-reorder-columns-dialog',
    imports: [UI_MODULES, DragDropModule],
    templateUrl: './reorder-columns-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './reorder-columns-dialog.component.scss',
})
export class ReorderColumnsDialogComponent {
    public columns: any[];

    constructor(
        private dialogRef: MatDialogRef<ReorderColumnsDialogComponent>,
        @Inject(MAT_DIALOG_DATA)
        public data: { columns: { id: number; name: string; order: number }[] },
    ) {
        this.columns = [...data.columns].sort((a, b) => a.order - b.order);
    }

    drop(event: CdkDragDrop<any[]>) {
        if (event.previousIndex === event.currentIndex) return;

        moveItemInArray(this.columns, event.previousIndex, event.currentIndex);
    }

    save() {
        const dto: UpdateColumnOrderDto[] = this.columns.map((col, index) => ({
            columnId: col.id,
            colOrder: index,
        }));

        this.dialogRef.close(dto);
    }

    cancel() {
        this.dialogRef.close(null);
    }
}
