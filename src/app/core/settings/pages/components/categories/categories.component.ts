import { Component, inject, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import { CategoryService } from '../../../../../shared/services/category.service';
import { MediaService } from '../../../../services/media.service';
import { SnackbarService } from '../../../../services/snackbar.service';
import { Category } from '../../../../../shared/models/category.model';
import { AppModule } from '../../../../../shared/models/app-module.enum';
import { CATEGORY_CAPABLE_MODULES } from '../../../../../shared/utilities/category-modules';
import { CategoryDialogComponent } from './category-dialog/category-dialog.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';

interface AppModuleToggleOption {
    value: AppModule;
    label: string;
    icon: string;
}

@Component({
    selector: 'app-categories',
    standalone: true,
    imports: [CommonModule, UI_MODULES],
    templateUrl: './categories.component.html',
    styleUrl: './categories.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class CategoriesComponent implements OnInit {
    protected readonly categoryService = inject(CategoryService);
    private readonly media = inject(MediaService);
    private readonly snackbar = inject(SnackbarService);
    private readonly dialog = inject(MatDialog);

    protected readonly moduleOptions: AppModuleToggleOption[] = [
        { value: AppModule.Calendar, label: 'Kalender', icon: 'calendar_today' },
        { value: AppModule.CustomTable, label: 'Tabellen', icon: 'table_chart' },
        { value: AppModule.Todo, label: 'Todos', icon: 'check_circle' },
        { value: AppModule.WorkTimePlanner, label: 'Arbeitszeitplaner', icon: 'schedule' },
    ].filter((option) => CATEGORY_CAPABLE_MODULES.includes(option.value));

    protected readonly visibleCategories = computed(() =>
        this.categoryService.categories().filter((category) => !category.isDeleted),
    );

    ngOnInit(): void {
        this.categoryService.loadCategories();
    }

    openAddCategoryDialog(): void {
        const dialogRef = this.dialog.open(CategoryDialogComponent, {
            width: this.media.isMobile() ? '90vw' : '480px',
            maxWidth: this.media.isMobile() ? '90vw' : '480px',
            data: {},
        });

        dialogRef.afterClosed().subscribe((dto) => {
            if (dto) {
                this.categoryService.addCategory(dto);
                this.snackbar.openSuccess('Kategorie erfolgreich erstellt');
            }
        });
    }

    openEditCategoryDialog(category: Category): void {
        const dialogRef = this.dialog.open(CategoryDialogComponent, {
            width: this.media.isMobile() ? '90vw' : '480px',
            maxWidth: this.media.isMobile() ? '90vw' : '480px',
            data: { category },
        });

        dialogRef.afterClosed().subscribe((dto) => {
            if (dto) {
                this.categoryService.updateCategory(category.id, dto);
                this.snackbar.openSuccess('Kategorie erfolgreich aktualisiert');
            }
        });
    }

    isModuleActive(category: Category, module: AppModule): boolean {
        return category.applicableModules?.includes(module) ?? false;
    }

    toggleModule(category: Category, module: AppModule): void {
        const current = category.applicableModules ?? [];
        const updated = current.includes(module)
            ? current.filter((m) => m !== module)
            : [...current, module];
        this.categoryService.setApplicableModules(category.id, updated);
    }

    openDeleteCategoryDialog(category: Category): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Kategorie löschen',
                message: `Möchtest du die Kategorie "${category.name}" wirklich löschen?`,
                confirmText: 'Löschen',
                cancelText: 'Abbrechen',
                isDestructive: true,
            },
        });

        dialogRef.afterClosed().subscribe((confirmed) => {
            if (confirmed) {
                this.categoryService.deleteCategory(category.id);
                this.snackbar.openSuccess('Kategorie wurde gelöscht');
            }
        });
    }
}
