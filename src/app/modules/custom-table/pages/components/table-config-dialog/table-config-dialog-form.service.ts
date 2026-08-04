import { Injectable, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
    ColumnInfo,
    CustomDataType,
    UpdateColumnDto,
    UpsertTableDto,
} from '../../../models';

@Injectable()
export class TableConfigDialogFormService {
    private readonly fb = inject(FormBuilder);

    readonly form = this.fb.nonNullable.group({
        tableName: ['', [Validators.required, Validators.maxLength(120)]],
        columnName: ['', [Validators.required, Validators.maxLength(120)]],
        columnDataType: [CustomDataType.String, [Validators.required]],
    });

    patchForTable(tableName: string): void {
        this.form.patchValue({ tableName });
        this.form.get('columnName')?.disable();
        this.form.get('columnDataType')?.disable();
    }

    patchForColumn(col: ColumnInfo): void {
        this.form.patchValue({
            columnName: col.name,
            columnDataType: col.dataType,
        });
        this.form.get('tableName')?.disable();
    }

    getCreateTableData(): UpsertTableDto {
        const value = this.form.getRawValue();
        return {
            name: value.tableName,
            column: {
                name: value.columnName,
                dataType: value.columnDataType,
                colOrder: 0,
            },
        };
    }

    getEditTableData(): string {
        return this.form.getRawValue().tableName;
    }

    getUpdateColumnData(colOrder: number): UpdateColumnDto {
        const value = this.form.getRawValue();
        return {
            name: value.columnName,
            colOrder,
            dataType: value.columnDataType,
        };
    }

    hasColumnDataTypeChanged(previous: CustomDataType): boolean {
        return this.form.getRawValue().columnDataType !== previous;
    }
}
