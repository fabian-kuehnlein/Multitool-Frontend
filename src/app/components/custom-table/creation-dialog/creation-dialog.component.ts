import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CreateTableDto, CustomDataType } from '../models/TableMetadata';

@Component({
  selector: 'app-creation-dialog',
  imports: [],
  templateUrl: './creation-dialog.component.html',
  styleUrl: './creation-dialog.component.scss'
})
export class CreationDialogComponent {
    private fb = inject(FormBuilder);
    private dialogRef = inject(MatDialogRef<CreationDialogComponent>);
    public dialog = inject(MatDialog);

    public dataTypes = Object.values(CustomDataType);

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
