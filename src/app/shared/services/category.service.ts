import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { finalize } from 'rxjs';
import { CategoryHttpService } from './category-http.service';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../models/category.model';
import { AppModule } from '../models/app-module.enum';
import { SnackbarService } from '../../core/services/snackbar.service';
import { SKIP_HTTP_ERROR_SNACKBAR } from '../../core/interceptors/http-error.interceptor';

@Injectable({
    providedIn: 'root',
})
export class CategoryService {
    private readonly httpService = inject(CategoryHttpService);
    private readonly snackbar = inject(SnackbarService);

    // State Signals
    private readonly _categories = signal<Category[]>([]);
    private readonly _loading = signal<boolean>(false);

    // Public Read-only Signals
    public readonly categories = this._categories.asReadonly();
    public readonly loading = this._loading.asReadonly();

    public categoriesForModule(module: AppModule): Signal<Category[]> {
        return computed(() =>
            this._categories().filter((category) => this.isSelectable(category, module)),
        );
    }

    public selectableCategoriesForModule(
        module: AppModule,
        getCurrentId: () => number | null | undefined,
    ): Signal<Category[]> {
        return computed(() => {
            const categories = this._categories();
            const selectable = categories.filter((category) =>
                this.isSelectable(category, module),
            );

            const currentId = getCurrentId();
            if (currentId != null && !selectable.some((category) => category.id === currentId)) {
                const current = categories.find((category) => category.id === currentId);
                if (current) {
                    selectable.push(current);
                }
            }

            return selectable;
        });
    }

    private isSelectable(category: Category, module: AppModule): boolean {
        return !category.isDeleted && (category.applicableModules ?? []).includes(module);
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
                        { ...dto, id, isDeleted: false },
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

    public setApplicableModules(id: number, applicableModules: AppModule[]): void {
        const category = this._categories().find((c) => c.id === id);
        if (!category) {
            return;
        }

        this._categories.update((categories) =>
            categories.map((c) => (c.id === id ? { ...c, applicableModules } : c)),
        );

        const dto: UpdateCategoryDto = {
            name: category.name,
            color: category.color,
            applicableModules,
        };

        const context = new HttpContext().set(SKIP_HTTP_ERROR_SNACKBAR, true);

        this.httpService.updateCategory(id, dto, context).subscribe({
            error: (err) => {
                this._categories.update((categories) =>
                    categories.map((c) =>
                        c.id === id ? { ...c, applicableModules: category.applicableModules } : c,
                    ),
                );
                this.snackbar.openError('Modul-Zuordnung konnte nicht gespeichert werden');
            },
        });
    }

    public deleteCategory(id: number): void {
        this.httpService.deleteCategory(id).subscribe({
            next: () => {
                this._categories.update((categories) =>
                    categories.map((category) =>
                        category.id === id ? { ...category, isDeleted: true } : category,
                    ),
                );
            },
        });
    }
}
