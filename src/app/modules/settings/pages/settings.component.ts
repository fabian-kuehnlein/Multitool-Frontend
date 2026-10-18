import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UI_MODULES } from '../../../shared/utilities/material-ui';
import { MediaService } from '../../../core/services/media.service';
import { SidenavComponent } from '../../../core/layout/sidenav/sidenav.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { WorkTimeSettingsComponent } from './components/work-time-settings/work-time-settings.component';
import { AppearanceSettingsComponent } from './components/appearance-settings/appearance-settings.component';
import { SettingsService } from '../services/settings.service';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [
        CommonModule,
        UI_MODULES,
        MatTabsModule,
        CategoriesComponent,
        WorkTimeSettingsComponent,
        AppearanceSettingsComponent,
    ],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class SettingsComponent implements OnInit {
    protected readonly media = inject(MediaService);
    protected readonly settingsService = inject(SettingsService);
    private readonly dialog = inject(MatDialog);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    protected readonly isMobile = this.media.isMobile;
    protected readonly isTablet = this.media.isTablet;
    protected readonly selectedTabIndex = signal<number>(0);

    ngOnInit(): void {
        this.settingsService.loadSettings().subscribe({ error: () => {} });

        this.route.queryParams.subscribe((params) => {
            const tab = params['tab'];
            const section = params['section'];

            if (tab === 'kategorien') {
                this.selectedTabIndex.set(1);
            } else {
                this.selectedTabIndex.set(0);
                if (section) {
                    this.scrollToSection(section);
                }
            }
        });
    }

    onTabChange(index: number): void {
        this.selectedTabIndex.set(index);
        const tabKey = index === 1 ? 'kategorien' : 'allgemein';
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { tab: tabKey, section: null },
            queryParamsHandling: 'merge',
        });
    }

    private scrollToSection(section: string): void {
        setTimeout(() => {
            const element =
                document.getElementById(`section-${section}`) ??
                document.getElementById(section);
            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
            }
        }, 120);
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
}
