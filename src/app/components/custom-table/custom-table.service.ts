import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateTableDto, TableDetail, TableOverview } from './models/TableMetadata';

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

    getListOfTables(): Observable<TableOverview[]> {
        return this.http.get<TableOverview[]>(`${this.apiURL}/GetTableList`)
    }

    getTable(tableId: number) {
        return this.http.get<TableDetail>(`${this.apiURL}/GetTable`, { params: {tableId} });
    }

    createTable(dto: CreateTableDto) {
        return this.http.post<number>(`${this.apiURL}/CreateTable`, dto);
    }

    updateTable() {

    }

    deleteTable() {

    }

    createColumn(tableId: number) {
        return this.http.post<number>(`${this.apiURL}/CreateColumn`, null,  { params: {tableId} });
    }

    createRow(tableId: number) {
        return this.http.post<number>(`${this.apiURL}/CreateRow`, null,  { params: {tableId} });
    }

    upsertCell(rowId: number, columnId: number, value: any) {
        const params = new HttpParams()
            .set('rowId', rowId.toString())
            .set('columnId', columnId.toString());
        
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' })

        const newvalue = JSON.stringify(value);

        return this.http.put<void>(`${this.apiURL}/SetCell`, JSON.stringify(value), { params, headers });
    }
}
