import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryHttpService {
    private readonly http = inject(HttpClient);
    private readonly apiURL = `${environment.MultitoolApi}/api/Category`;

    getCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(`${this.apiURL}/categories`);
    }
}
