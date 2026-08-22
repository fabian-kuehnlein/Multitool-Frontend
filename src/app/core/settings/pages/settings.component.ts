import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UI_MODULES } from '../../../shared/utilities/material-ui';
import { ThemeService } from '../../services/theme.service';
import { CategoryService } from '../../../shared/services/category.service';
import { MediaService } from '../../services/media.service';
import { SnackbarService } from '../../services/snackbar.service';
import { SidenavComponent } from '../../layout/sidenav/sidenav.component';
import { Category } from '../../../shared/models/category.model';
import { CategoryDialogComponent } from './components/category-dialog/category-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, UI_MODULES, MatTabsModule],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class SettingsComponent implements OnInit {
    protected readonly themeService = inject(ThemeService);
    protected readonly categoryService = inject(CategoryService);
    protected readonly media = inject(MediaService);
    private readonly snackbar = inject(SnackbarService);
    private readonly dialog = inject(MatDialog);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    protected readonly isMobile = this.media.isMobile;
    protected readonly isTablet = this.media.isTablet;
    protected readonly selectedTabIndex = signal<number>(0);

    ngOnInit(): void {
        this.categoryService.loadCategories();

        this.route.queryParams.subscribe((params) => {
            const tab = params['tab'];
            if (tab === 'kategorien') {
                this.selectedTabIndex.set(1);
            } else {
                this.selectedTabIndex.set(0);
            }
        });
    }

    onTabChange(index: number): void {
        this.selectedTabIndex.set(index);
        const tabKey = index === 1 ? 'kategorien' : 'allgemein';
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { tab: tabKey },
            queryParamsHandling: 'merge',
        });
    }

    openSideNav(): void {
        this.dialog.open(SidenavComponent, {
            position: this.media.isMobile()
                ? { bottom: '120px' }
                : { top: '90px', left: '30px' },
            width: this.media.isMobile() ? '90vw' : 'auto',
            height: 'auto',
            hasBackdrop: true,
            backdropClass: 'transparent-backdrop',
            data: 'settings',
        });
    }

    toggleTheme(): void {
        this.themeService.toggle();
        const mode = this.themeService.isDark() ? 'Dark Mode' : 'Light Mode';
        this.snackbar.openSuccess(`Erscheinungsbild auf ${mode} gewechselt`);
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
