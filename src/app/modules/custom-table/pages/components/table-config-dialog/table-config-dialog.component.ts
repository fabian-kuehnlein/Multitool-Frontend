import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogRef,
} from '@angular/material/dialog';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ColumnInfo, DialogMode } from '../../../models';
import { DATA_TYPE_OPTIONS } from '../../../utilities/custom-table.config';
import { TableConfigDialogFormService } from './table-config-dialog-form.service';

export interface TableConfigDialogData {
    dialogMode: DialogMode;
    tableName?: string;
    col?: ColumnInfo;
    hasValues?: boolean;
}

@Component({
    selector: 'app-table-config-dialog',
    standalone: true,
    imports: [UI_MODULES],
    providers: [TableConfigDialogFormService],
    templateUrl: './table-config-dialog.component.html',
    styleUrl: './table-config-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class TableConfigDialogComponent {
    readonly DialogMode = DialogMode;

    private readonly dialogRef = inject(MatDialogRef<TableConfigDialogComponent>);
    private readonly data = inject<TableConfigDialogData>(MAT_DIALOG_DATA);
    private readonly dialog = inject(MatDialog);
    protected readonly formService = inject(TableConfigDialogFormService);
    protected readonly dataTypes = DATA_TYPE_OPTIONS;
    protected readonly dialogMode = this.data.dialogMode;

    readonly form = this.formService.form;

    private readonly formValue = toSignal(this.form.valueChanges, {
        initialValue: this.form.getRawValue(),
    });

    protected readonly tableNameCharCount = computed(
        () => (this.formValue()?.tableName ?? '').length,
    );
    protected readonly columnNameCharCount = computed(
        () => (this.formValue()?.columnName ?? '').length,
    );

    constructor() {
        if (this.data.dialogMode === DialogMode.EDIT_TABLE && this.data.tableName) {
            this.formService.patchForTable(this.data.tableName);
        } else if (
            this.data.dialogMode === DialogMode.EDIT_COLUMN &&
            this.data.col
        ) {
            this.formService.patchForColumn(this.data.col);
        }
    }

    save(): void {
        if (this.form.invalid) return;

        switch (this.data.dialogMode) {
            case DialogMode.CREATE_TABLE:
                this.dialogRef.close(this.formService.getCreateTableData());
                break;

            case DialogMode.EDIT_TABLE:
                this.dialogRef.close(this.formService.getEditTableData());
                break;

            case DialogMode.EDIT_COLUMN:
                const colOrder = this.data.col?.colOrder ?? 0;
                if (
                    this.data.col &&
                    this.formService.hasColumnDataTypeChanged(this.data.col.dataType)
                ) {
                    this.confirmDataTypeChange(colOrder);
                } else {
                    this.dialogRef.close(
                        this.formService.getUpdateColumnData(colOrder),
                    );
                }
                break;
        }
    }

    private confirmDataTypeChange(colOrder: number): void {
        this.dialog
            .open(ConfirmDialogComponent, {
                data: {
                    title: 'Datentyp ändern',
                    message:
                        'Wenn du den Datentyp änderst, können die bestehenden Daten in dieser Spalte verloren gehen. Möchtest du fortfahren?',
                    confirmText: 'Ändern',
                    cancelText: 'Abbrechen',
                    isDestructive: true,
                },
            })
            .afterClosed()
            .subscribe((result) => {
                if (!result) return;
                this.dialogRef.close(
                    this.formService.getUpdateColumnData(colOrder),
                );
            });
    }

    delete(): void {
        this.dialog
            .open(ConfirmDialogComponent, {
                data: {
                    title: 'Spalte löschen',
                    message:
                        'Möchtest du diese Spalte wirklich löschen? Alle Daten in dieser Spalte gehen verloren.',
                    confirmText: 'Löschen',
                    isDestructive: true,
                },
            })
            .afterClosed()
            .subscribe((result) => {
                if (!result) return;
                this.dialogRef.close(true);
            });
    }

    cancel(): void {
        this.dialogRef.close(null);
    }
}
