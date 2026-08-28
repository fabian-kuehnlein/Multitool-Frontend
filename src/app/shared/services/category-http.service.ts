import { inject, Injectable } from '@angular/core';
import { HttpContext, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../models/category.model';

@Injectable({
    providedIn: 'root',
})
export class CategoryHttpService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.MultitoolApi}/api/Category`;

    getCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(`${this.apiUrl}/categories`);
    }

    createCategory(dto: CreateCategoryDto): Observable<number> {
        return this.http.post<number>(`${this.apiUrl}/categories`, dto);
    }

    updateCategory(
        id: number,
        dto: UpdateCategoryDto,
        context?: HttpContext,
    ): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/categories/${id}`, dto, {
            context,
        });
    }

    deleteCategory(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/categories/${id}`);
    }
}
