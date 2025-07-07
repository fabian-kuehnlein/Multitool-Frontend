import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CreateTableDto, CustomDataType } from '../models/TableMetadata';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UI_MODULES } from '../../../shared/material-ui';

@Component({
  selector: 'app-creation-dialog',
  imports: [
    UI_MODULES,
    MatFormFieldModule,
    ReactiveFormsModule
  ],
  templateUrl: './creation-dialog.component.html',
  styleUrl: './creation-dialog.component.scss'
})
export class CreationDialogComponent {
    private fb = inject(FormBuilder);
    private dialogRef = inject(MatDialogRef<CreationDialogComponent>);
    public dialog = inject(MatDialog);

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
        { value: CustomDataType.Bool, label: 'Ja/Nein' }
    ];

    public form = this.fb.group({
        tableName:      ['', [Validators.required, Validators.maxLength(120)]],
        columnName:     ['', [Validators.required, Validators.maxLength(120)]],
        columnDataType: [CustomDataType.String, Validators.required]
    });

    save() {
        if (this.form.invalid) return;

        const dto: CreateTableDto = {
            name: this.form.value.tableName!,
            column: {
                name: this.form.value.columnName!,
                dataType: this.form.value.columnDataType as CustomDataType,
                colOrder: 0
            }
        };

        this.dialogRef.close(dto);
    }

    cancel() {
        this.dialogRef.close(null);
    }
}
