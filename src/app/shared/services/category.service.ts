import { inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { CategoryHttpService } from './category-http.service';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../models/category.model';

@Injectable({
    providedIn: 'root',
})
export class CategoryService {
    private readonly httpService = inject(CategoryHttpService);

    // State Signals
    private readonly _categories = signal<Category[]>([]);
    private readonly _loading = signal<boolean>(false);

    // Public Read-only Signals
    public readonly categories = this._categories.asReadonly();
    public readonly loading = this._loading.asReadonly();

    constructor() {
        this.loadCategories();
    }

    public loadCategories(): void {
        this._loading.set(true);
        this.httpService
            .getCategories()
            .pipe(finalize(() => this._loading.set(false)))
            .subscribe({
                next: (categories) => this._categories.set(categories),
            });
    }

    public addCategory(dto: CreateCategoryDto): void {
        this._loading.set(true);
        this.httpService
            .createCategory(dto)
            .pipe(finalize(() => this._loading.set(false)))
            .subscribe({
                next: (id) => {
                    this._categories.update((categories) => [
                        ...categories,
                        { ...dto, id },
                    ]);
                },
            });
    }

    public updateCategory(id: number, dto: UpdateCategoryDto): void {
        this._loading.set(true);
        this.httpService
            .updateCategory(id, dto)
            .pipe(finalize(() => this._loading.set(false)))
            .subscribe({
                next: () => {
                    this._categories.update((categories) =>
                        categories.map((category) =>
                            category.id === id
                                ? { ...category, ...dto }
                                : category,
                        ),
                    );
                },
            });
    }

    public deleteCategory(id: number): void {
        this.httpService.deleteCategory(id).subscribe({
            next: () => {
                this._categories.update((categories) =>
                    categories.filter((category) => category.id !== id),
                );
            },
        });
    }
}
