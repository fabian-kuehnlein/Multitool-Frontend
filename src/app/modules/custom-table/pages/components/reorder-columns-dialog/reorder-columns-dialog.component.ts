import {
    CdkDragDrop,
    DragDropModule,
    moveItemInArray,
} from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UpdateColumnOrderDto } from '../../../models';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';

export interface ReorderableColumn {
    id: number;
    name: string;
    order: number;
}

@Component({
    selector: 'app-reorder-columns-dialog',
    standalone: true,
    imports: [UI_MODULES, DragDropModule],
    templateUrl: './reorder-columns-dialog.component.html',
    styleUrl: './reorder-columns-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class ReorderColumnsDialogComponent {
    private readonly dialogRef = inject(
        MatDialogRef<ReorderColumnsDialogComponent>,
    );
    private readonly data = inject<{ columns: ReorderableColumn[] }>(
        MAT_DIALOG_DATA,
    );

    readonly columns = [...this.data.columns].sort((a, b) => a.order - b.order);

    drop(event: CdkDragDrop<ReorderableColumn[]>): void {
        if (event.previousIndex === event.currentIndex) return;

        moveItemInArray(this.columns, event.previousIndex, event.currentIndex);
    }

    save(): void {
        const dto: UpdateColumnOrderDto[] = this.columns.map((col, index) => ({
            columnId: col.id,
            colOrder: index,
        }));

        this.dialogRef.close(dto);
    }

    cancel(): void {
        this.dialogRef.close(null);
    }
}
