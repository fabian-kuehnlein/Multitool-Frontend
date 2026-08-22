import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../models/category.model';

@Injectable({
    providedIn: 'root',
})
export class CategoryHttpService {
    private readonly http = inject(HttpClient);
    private readonly apiURL = `${environment.MultitoolApi}/api/Category`;

    getCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(`${this.apiURL}/categories`);
    }

    createCategory(dto: CreateCategoryDto): Observable<number> {
        return this.http.post<number>(`${this.apiURL}/categories`, dto);
    }

    updateCategory(id: number, dto: UpdateCategoryDto): Observable<void> {
        return this.http.put<void>(`${this.apiURL}/categories/${id}`, dto);
    }

    deleteCategory(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiURL}/categories/${id}`);
    }
}
