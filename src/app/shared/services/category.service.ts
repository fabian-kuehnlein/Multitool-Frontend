import { inject, Injectable, signal } from '@angular/core';
import { CategoryHttpService } from './category-http.service';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
    private readonly httpService = inject(CategoryHttpService);

    private readonly _categories = signal<Category[]>([]);
    public readonly categories = this._categories.asReadonly();

    constructor() {
        setInterval(() => {
            this.loadCategories();
        }, 60000);
        this.loadCategories();
    }

    public loadCategories(): void {
        this.httpService.getCategories().subscribe(
            categories => this._categories.set(categories)
        );
    }
}
