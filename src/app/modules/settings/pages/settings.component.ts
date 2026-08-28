import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UI_MODULES } from '../../../shared/utilities/material-ui';
import { ThemeService } from '../../../core/services/theme.service';
import { MediaService } from '../../../core/services/media.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { SidenavComponent } from '../../../core/layout/sidenav/sidenav.component';
import { CategoriesComponent } from './components/categories/categories.component';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, UI_MODULES, MatTabsModule, CategoriesComponent],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class SettingsComponent implements OnInit {
    protected readonly themeService = inject(ThemeService);
    protected readonly media = inject(MediaService);
    private readonly snackbar = inject(SnackbarService);
    private readonly dialog = inject(MatDialog);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    protected readonly isMobile = this.media.isMobile;
    protected readonly isTablet = this.media.isTablet;
    protected readonly selectedTabIndex = signal<number>(0);

    ngOnInit(): void {
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
}
