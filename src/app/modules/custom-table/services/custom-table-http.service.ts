import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UpsertTableDto, TableDetail, TableOverview, UpdateColumnDto, UpdateColumnOrderDto, UpdateRowOrderDto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CustomTableHttpService {
    private readonly http = inject(HttpClient);
    private readonly apiURL = `${environment.MultitoolApi}/api/CustomTable`;

    getListOfTables(): Observable<TableOverview[]> {
        return this.http.get<TableOverview[]>(`${this.apiURL}/tables`);
    }

    getTable(tableId: number): Observable<TableDetail> {
        return this.http.get<TableDetail>(`${this.apiURL}/tables/${tableId}`);
    }

    createTable(dto: UpsertTableDto): Observable<number> {
        return this.http.post<number>(`${this.apiURL}/tables`, dto);
    }

    updateTable(tableId: number, newName: string): Observable<number> {
        return this.http.put<number>(`${this.apiURL}/tables/${tableId}`, { name: newName });
    }

    deleteTable(tableId: number): Observable<any> {
        return this.http.delete(`${this.apiURL}/tables/${tableId}`);
    }

    createColumn(tableId: number): Observable<number> {
        return this.http.post<number>(`${this.apiURL}/tables/${tableId}/columns`, null);
    }

    updateColumn(columnId: number, dto: UpdateColumnDto): Observable<number> {
        return this.http.put<number>(`${this.apiURL}/columns/${columnId}`, dto);
    }

    updateColumnOrder(dto: UpdateColumnOrderDto[]): Observable<number> {
        return this.http.put<number>(`${this.apiURL}/columns/order`, dto);
    }

    deleteColumn(tableId: number, columnId: number): Observable<any> {
        return this.http.delete(`${this.apiURL}/tables/${tableId}/columns/${columnId}`);
    }

    createRow(tableId: number): Observable<number> {
        return this.http.post<number>(`${this.apiURL}/tables/${tableId}/rows`, null);
    }

    updateRowOrder(rows: UpdateRowOrderDto[]): Observable<any> {
        return this.http.put(`${this.apiURL}/rows/order`, rows);
    }

    deleteRows(tableId: number, rows: number[]): Observable<any> {
        return this.http.delete(`${this.apiURL}/tables/${tableId}/rows`, { body: rows });
    }

    upsertCell(rowId: number, columnId: number, value: any): Observable<void> {
        const headers = { 'Content-Type': 'application/json' };
        return this.http.put<void>(`${this.apiURL}/rows/${rowId}/cells/${columnId}`, JSON.stringify(value), { headers });
    }
}
