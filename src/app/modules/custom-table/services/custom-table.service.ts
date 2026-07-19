import { inject, Injectable, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
    UpsertTableDto,
    TableDetail,
    TableOverview,
    UpdateColumnDto,
    UpdateColumnOrderDto,
    UpdateRowOrderDto,
} from '../models';
import { CustomTableHttpService } from './custom-table-http.service';

@Injectable({
    providedIn: 'root',
})
export class CustomTableService {
    private readonly httpService = inject(CustomTableHttpService);

    // --- Signals for State Management ---
    private readonly _tableList = signal<TableOverview[]>([]);
    private readonly _currentTable = signal<TableDetail | null>(null);
    private readonly _loading = signal<boolean>(false);

    // Public Read-only Signals
    public readonly tableList = this._tableList.asReadonly();
    public readonly currentTable = this._currentTable.asReadonly();
    public readonly loading = this._loading.asReadonly();

    // Derived Signals
    public readonly tableId = computed(
        () => this._currentTable()?.tableId ?? 0,
    );
    public readonly columns = computed(() => {
        const table = this._currentTable();
        return table
            ? [...table.columns].sort((a, b) => a.colOrder - b.colOrder)
            : [];
    });
    public readonly rows = computed(() => {
        const table = this._currentTable();
        return table
            ? [...table.rows].sort((a, b) => a.rowOrder - b.rowOrder)
            : [];
    });

    // --- State Management Actions ---

    fetchTableList(): void {
        this._loading.set(true);
        this.httpService.getListOfTables().subscribe({
            next: (list) => {
                this._tableList.set(list);
                this._loading.set(false);
            },
            error: () => this._loading.set(false),
        });
    }

    loadTable(tableId: number): void {
        this._loading.set(true);
        this.httpService.getTable(tableId).subscribe({
            next: (table) => {
                this._currentTable.set(table);
                this._loading.set(false);
            },
            error: () => this._loading.set(false),
        });
    }

    createTable(dto: UpsertTableDto): Observable<number> {
        return this.httpService.createTable(dto).pipe(
            tap((id) => {
                this.fetchTableList();
                this.loadTable(id);
            }),
        );
    }

    updateTable(tableId: number, newName: string): Observable<number> {
        return this.httpService.updateTable(tableId, newName).pipe(
            tap(() => {
                this.fetchTableList();
                this.loadTable(tableId);
            }),
        );
    }

    deleteTable(tableId: number): Observable<any> {
        return this.httpService.deleteTable(tableId).pipe(
            tap(() => {
                this.fetchTableList();
                if (this.tableId() === tableId) {
                    this._currentTable.set(null);
                }
            }),
        );
    }

    createColumn(tableId: number): Observable<number> {
        return this.httpService
            .createColumn(tableId)
            .pipe(tap(() => this.loadTable(tableId)));
    }

    updateColumn(columnId: number, dto: UpdateColumnDto): Observable<number> {
        return this.httpService
            .updateColumn(columnId, dto)
            .pipe(tap(() => this.loadTable(this.tableId())));
    }

    updateColumnOrder(dto: UpdateColumnOrderDto[]): Observable<number> {
        return this.httpService
            .updateColumnOrder(dto)
            .pipe(tap(() => this.loadTable(this.tableId())));
    }

    deleteColumn(tableId: number, columnId: number): Observable<any> {
        return this.httpService
            .deleteColumn(tableId, columnId)
            .pipe(tap(() => this.loadTable(tableId)));
    }

    createRow(tableId: number): Observable<number> {
        return this.httpService
            .createRow(tableId)
            .pipe(tap(() => this.loadTable(tableId)));
    }

    updateRowOrder(rows: UpdateRowOrderDto[]): Observable<any> {
        return this.httpService.updateRowOrder(rows);
    }

    deleteRows(tableId: number, rows: number[]): Observable<any> {
        return this.httpService
            .deleteRows(tableId, rows)
            .pipe(tap(() => this.loadTable(tableId)));
    }

    upsertCell(rowId: number, columnId: number, value: any): Observable<void> {
        return this.httpService.upsertCell(rowId, columnId, value);
    }
}
