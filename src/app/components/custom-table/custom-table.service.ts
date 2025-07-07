import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateColumnDto, CreateTableDto, TableDetail, TableOverview } from './models/TableMetadata';

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

    createColumns(id: number, dto: CreateColumnDto) {
        return this.http.post<number>(`${this.apiURL}/CreateColumn`, dto, { params: {id} });
    }
}
