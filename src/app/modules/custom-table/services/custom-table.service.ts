import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UpsertTableDto, TableDetail, TableOverview, UpdateColumnDto, UpdateColumnOrderDto, UpdateRowOrderDto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CustomTableService {

    private readonly http = inject(HttpClient)
    private readonly apiURL = `${environment.MultitoolApi}/api/CustomTable`;

    // development route
    // returns a table with fixed values
    getDevTable() {
        return this.http.get<TableDetail>(`${this.apiURL}/GetDevTable`);
    }
    //

    // returns the table list to select
    getListOfTables(): Observable<TableOverview[]> {
        return this.http.get<TableOverview[]>(`${this.apiURL}/GetTableList`)
    }

    // loads table
    getTable(tableId: number) {
        return this.http.get<TableDetail>(`${this.apiURL}/GetTable`, { params: {tableId} });
    }

    // creates table with name and first row
    createTable(dto: UpsertTableDto) {
        return this.http.post<number>(`${this.apiURL}/CreateTable`, dto);
    }

    // updates tablename
    updateTable(tableId: number, newName: string) {
        return this.http.put<number>(`${this.apiURL}/UpdateTable`, null, { params: {tableId, newName} });
    }

    // deletes table
    deleteTable(tableId: number) {
        return this.http.delete(`${this.apiURL}/DeleteTable`, { params: {tableId}});
    }

    // creates column with base name and datatype
    createColumn(tableId: number) {
        return this.http.post<number>(`${this.apiURL}/CreateColumn`, null,  { params: {tableId} });
    }

    // updates column name, column order and datatype, deletes all data when switching datatype
    updateColumn(tableId: number, columnId: number, dto: UpdateColumnDto) {
        return this.http.put<number>(`${this.apiURL}/UpdateColumn`, dto,  { params: {tableId, columnId} });
    }

    updateColumnOrder(dto: UpdateColumnOrderDto[]) {
        return this.http.put<number>(`${this.apiURL}/UpdateColumnOrder`, dto);
    }

    // deletes full column
    deleteColumn(tableId: number, columnId: number) {
        return this.http.delete(`${this.apiURL}/DeleteColumn`, { params: {tableId, columnId}})
    }

    // create empty row for chosen table
    createRow(tableId: number) {
        return this.http.post<number>(`${this.apiURL}/CreateRow`, null,  { params: {tableId} });
    }

    updateRowOrder(rows: UpdateRowOrderDto[]) {
        return this.http.put(`${this.apiURL}/UpdateRowOrder`, rows);
    }

    // deletes full row
    deleteRows(tableId: number, rows: number[]) {
        return this.http.delete(`${this.apiURL}/DeleteRows`, { body: rows, params: {tableId}})
    }

    // adds or updates cell data
    upsertCell(rowId: number, columnId: number, value: any) {
        const params = new HttpParams()
            .set('rowId', rowId.toString())
            .set('columnId', columnId.toString());
        
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' })

        return this.http.put<void>(`${this.apiURL}/SetCell`, JSON.stringify(value), { params, headers });
    }
}
