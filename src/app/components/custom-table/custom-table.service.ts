import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ColumnsResponse, RowsResponse, TableInfo } from './models/TableMetadata';

@Injectable({
  providedIn: 'root'
})
export class CustomTableService {

    private readonly http = inject(HttpClient)
    private readonly apiURL = `${environment.MultitoolApi}/api/CustomTable`;

    getListOfTables() {
        return this.http.get<TableInfo[]>(`${this.apiURL}/GetTables`)
    }

    getColumns(id: string): Observable<ColumnsResponse> {
        let params = new HttpParams().set('id', id);
        return this.http.get<ColumnsResponse>(`${this.apiURL}/GetColumns`, {params});
    }

    getRows(tableId: string, pageNr: number, pageSize: number): Observable<RowsResponse> {
        let params = new HttpParams()
            .set('pageNr', pageNr)
            .set('pageSize', pageSize)
            .set('tableId', tableId);

        return this.http.get<RowsResponse>(`${environment.MultitoolApi}/${this.apiURL}/GetRows`, {params})
    }
}
