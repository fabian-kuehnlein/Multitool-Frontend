import { inject, Injectable, signal, computed } from '@angular/core';
import { finalize } from 'rxjs';
import {
    UpsertTableDto,
    TableDetail,
    TableOverview,
    UpdateColumnDto,
    UpdateColumnOrderDto,
    UpdateRowOrderDto,
    CellValue,
} from '../models';
import { CustomTableHttpService } from './custom-table-http.service';

@Injectable({
    providedIn: 'root',
})
export class CustomTableService {
    private readonly httpService = inject(CustomTableHttpService);

    // Private State Signals
    private readonly _tableList = signal<TableOverview[]>([]);
    private readonly _currentTable = signal<TableDetail | null>(null);
    private readonly _loading = signal<boolean>(false);

    // Public Read-only Signals
    readonly tableList = this._tableList.asReadonly();
    readonly currentTable = this._currentTable.asReadonly();
    readonly loading = this._loading.asReadonly();

    // Derived Signals
    readonly tableId = computed(() => this._currentTable()?.tableId ?? 0);

    readonly columns = computed(() => {
        const table = this._currentTable();
        return table
            ? [...table.columns].sort((a, b) => a.colOrder - b.colOrder)
            : [];
    });

    readonly rows = computed(() => {
        const table = this._currentTable();
        return table
            ? [...table.rows].sort((a, b) => a.rowOrder - b.rowOrder)
            : [];
    });

    fetchTableList(): void {
        this._loading.set(true);
        this.httpService
            .getListOfTables()
            .pipe(finalize(() => this._loading.set(false)))
            .subscribe({
                next: (list) => this._tableList.set(list),
            });
    }

    loadTable(tableId: number, showLoading = true): void {
        if (showLoading) {
            this._loading.set(true);
        }
        this.httpService
            .getTable(tableId)
            .pipe(finalize(() => this._loading.set(false)))
            .subscribe({
                next: (table) => this._currentTable.set(table),
            });
    }

    createTable(dto: UpsertTableDto): void {
        this.httpService.createTable(dto).subscribe({
            next: (id) => {
                this.fetchTableList();
                this.loadTable(id);
            },
        });
    }

    updateTable(tableId: number, newName: string): void {
        this.httpService.updateTable(tableId, newName).subscribe({
            next: () => {
                this.fetchTableList();
                this.loadTable(tableId);
            },
        });
    }

    deleteTable(tableId: number): void {
        this.httpService.deleteTable(tableId).subscribe({
            next: () => {
                this.fetchTableList();
                if (this.tableId() === tableId) {
                    this._currentTable.set(null);
                }
            },
        });
    }

    createColumn(tableId: number): void {
        this.httpService.createColumn(tableId).subscribe({
            next: () => this.loadTable(tableId),
        });
    }

    updateColumn(columnId: number, dto: UpdateColumnDto): void {
        this.httpService.updateColumn(columnId, dto).subscribe({
            next: () => this.loadTable(this.tableId()),
        });
    }

    updateColumnOrder(dto: UpdateColumnOrderDto[]): void {
        this.httpService.updateColumnOrder(dto).subscribe({
            next: () => this.loadTable(this.tableId()),
        });
    }

    deleteColumn(tableId: number, columnId: number): void {
        this.httpService.deleteColumn(tableId, columnId).subscribe({
            next: () => this.loadTable(tableId),
        });
    }

    createRow(tableId: number): void {
        this.httpService.createRow(tableId).subscribe({
            next: () => this.loadTable(tableId),
        });
    }

    updateRowOrder(rows: UpdateRowOrderDto[]): void {
        const table = this._currentTable();
        if (table) {
            const orderMap = new Map(rows.map((r) => [r.rowId, r.rowOrder]));
            this._currentTable.set({
                ...table,
                rows: table.rows.map((row) => ({
                    ...row,
                    rowOrder: orderMap.get(row.rowId) ?? row.rowOrder,
                })),
            });
        }
        this.httpService.updateRowOrder(rows).subscribe({
            next: () => this.loadTable(this.tableId()),
        });
    }

    deleteRows(tableId: number, rows: number[]): void {
        this.httpService.deleteRows(tableId, rows).subscribe({
            next: () => this.loadTable(tableId),
        });
    }

    upsertCell(rowId: number, columnId: number, value: CellValue): void {
        this.httpService.upsertCell(rowId, columnId, value).subscribe();
    }
}
