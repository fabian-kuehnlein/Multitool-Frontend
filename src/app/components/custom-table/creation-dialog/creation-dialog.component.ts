import { Component, Inject, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CreateTableDto, CustomDataType, UpdateColumnDto } from '../models/TableMetadata';
import { UI_MODULES } from '../../../shared/material-ui';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

enum DialogMode {
    CreateTable = 'CreateTable',
    EditTable = 'EditTable',
    EditColumn = 'EditColumn'
}

@Component({
  selector: 'app-creation-dialog',
  imports: [
    UI_MODULES
  ],
  templateUrl: './creation-dialog.component.html',
  styleUrl: './creation-dialog.component.scss'
})
export class CreationDialogComponent {
    dialogMode: DialogMode = DialogMode.CreateTable;

    private readonly fb = inject(FormBuilder);
    private readonly dialogRef = inject(MatDialogRef<CreationDialogComponent>);
    public readonly dialog = inject(MatDialog);

    // for char-count on title and note inputs
    protected readonly values = signal<Record<string, string>>({
        tableName: '',
        columnName: ''
    });

    // handles char-count for title and note inputs
    protected onInput(key: string, event: Event) {
        const input = (event.target as HTMLInputElement).value;
        this.values.update(current => ({
            ...current,
            [key]: input
        }));
    }

    public dataTypes = [
        { value: CustomDataType.String, label: 'Text (Standard)' },
        { value: CustomDataType.Int, label: 'Zahl' },
        { value: CustomDataType.Decimal, label: 'Gleitkommazahl' },
        { value: CustomDataType.Date, label: 'Datum' },
        { value: CustomDataType.Bool, label: 'Checkbox' }
    ];

    public form = this.fb.group({
        tableName:      ['', [Validators.required, Validators.maxLength(120)]],
        columnName:     ['', [Validators.required, Validators.maxLength(120)]],
        columnDataType: [CustomDataType.String, Validators.required]
    });

    constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
        this.dialogMode = data.dialogMode;

        if (data.tableName) {
            this.form.patchValue({
                tableName: data.tableName
            });

            this.values.set({
                ...this.values(),
                tableName: data.tableName
            })

            this.form.get('columnName')?.disable();
            this.form.get('columnDataType')?.disable();
        }

        if (data.col) {
            this.form.patchValue({
                columnName: data.col.columnName,
                columnDataType: data.col.dataType as CustomDataType
            });

            this.values.set({
                ...this.values(),
                columnName: data.col.columnName
            })

            this.form.get('tableName')?.disable();
        }
    }

    save() {
        if (this.form.invalid) return;

        switch (this.dialogMode) {
            case ('CreateTable'):
                const createDto: CreateTableDto = {
                    name: this.form.value.tableName!,
                    column: {
                        name: this.form.value.columnName!,
                        dataType: this.form.value.columnDataType as CustomDataType,
                        colOrder: 0
                    }
                };

                this.dialogRef.close(createDto);
                break;

            case ('EditTable'):
                const newName = this.form.value.tableName!;

                this.dialogRef.close(newName);
                break;

            case ('EditColumn'):
                const updateColDto: UpdateColumnDto = {
                    name: this.form.value.columnName!,
                    colOrder: this.data.col.colOrder,
                    dataType: this.form.value.columnDataType as CustomDataType
                };

                // if dataType was changed, ask User through ConfirmDialog for Confirmation
                if (this.form.value.columnDataType !== this.data.col.dataType) {
                    this.dialog.open(ConfirmDialogComponent, { minHeight: '270px', data: true }).afterClosed().subscribe(result => {
                        // if false, cancel save(), else proceed
                        if (!result) return;
                        this.dialogRef.close(updateColDto);
                    });
                    return;
                }

                // standard if no dataType was changed
                this.dialogRef.close(updateColDto);
                break;

            default:
                this.cancel();
        }
    }

    delete() {
       this.dialogRef.close(true);
    }

    cancel() {
        this.dialogRef.close(null);
    }
}
