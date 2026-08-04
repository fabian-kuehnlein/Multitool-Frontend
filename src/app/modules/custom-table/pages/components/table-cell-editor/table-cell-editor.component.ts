import {
    ChangeDetectionStrategy,
    Component,
    effect,
    inject,
    input,
} from '@angular/core';
import { FormControl, Validators, ValidatorFn } from '@angular/forms';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import { MediaService } from '../../../../../core/services/media.service';
import { CustomTableService } from '../../../services/custom-table.service';
import {
    CellValue,
    ColumnInfo,
    CustomDataType,
    RowInfo,
} from '../../../models';

@Component({
    selector: 'app-table-cell-editor',
    standalone: true,
    imports: [UI_MODULES],
    templateUrl: './table-cell-editor.component.html',
    styleUrl: './table-cell-editor.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class TableCellEditorComponent {
    readonly CustomDataType = CustomDataType;

    readonly row = input.required<RowInfo>();
    readonly col = input.required<ColumnInfo>();

    private readonly tableService = inject(CustomTableService);
    private readonly media = inject(MediaService);

    readonly isMobile = this.media.isMobile;

    protected readonly control = new FormControl<CellValue | Date>('');
    private initialValue: CellValue | Date = '';

    constructor() {
        effect(() => {
            const row = this.row();
            const col = this.col();

            this.control.setValue(row.cells[col.columnId] ?? '', {
                emitEvent: false,
            });
            this.control.setValidators(this.buildValidators(col));
            this.control.updateValueAndValidity({ emitEvent: false });
        });
    }

    onCellFocus(): void {
        this.initialValue = this.control.value;
    }

    onCellBlur(): void {
        if (this.valuesAreEqual(this.initialValue, this.control.value)) {
            return;
        }

        this.tableService.upsertCell(
            this.row().rowId,
            this.col().columnId,
            this.control.value as CellValue,
        );
    }

    increment(): void {
        this.adjustValue(this.isDecimal() ? 0.01 : 1);
    }

    decrement(): void {
        this.adjustValue(this.isDecimal() ? -0.01 : -1);
    }

    private isDecimal(): boolean {
        return this.col().dataType === CustomDataType.Decimal;
    }

    private adjustValue(step: number): void {
        const current = this.control.value;
        const base =
            typeof current === 'number' && Number.isFinite(current)
                ? current
                : 0;

        let next = base + step;
        if (this.isDecimal()) {
            next = Math.round(next * 100) / 100;
        }

        this.control.setValue(next);
        this.tableService.upsertCell(
            this.row().rowId,
            this.col().columnId,
            next,
        );
    }

    private buildValidators(col: ColumnInfo): ValidatorFn[] {
        if (col.dataType === CustomDataType.Int) {
            return [Validators.pattern(/^\d+$/)];
        }
        if (col.dataType === CustomDataType.Decimal) {
            return [Validators.pattern(/^\d+(\.\d{1,2})?$/)];
        }
        return [];
    }

    private valuesAreEqual(a: CellValue | Date, b: CellValue | Date): boolean {
        if (a === b) return true;
        if (a instanceof Date && b instanceof Date) {
            return a.getTime() === b.getTime();
        }
        return false;
    }
}
