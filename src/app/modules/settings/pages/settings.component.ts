import {
    Component,
    computed,
    inject,
    OnInit,
    signal,
    ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { UI_MODULES } from '../../../shared/utilities/material-ui';
import { MediaService } from '../../../core/services/media.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { SidenavComponent } from '../../../core/layout/sidenav/sidenav.component';
import { SettingsTab } from '../models/settings-tab.enum';
import { SETTINGS_TABS } from '../utilities/settings-tabs.config';
import { CategoriesComponent } from './components/categories/categories.component';
import { WorkTimeSettingsComponent } from './components/work-time-settings/work-time-settings.component';
import { AppearanceSettingsComponent } from './components/appearance-settings/appearance-settings.component';
import { AdminSettingsComponent } from './components/admin-settings/admin-settings.component';
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
        AdminSettingsComponent,
    ],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class SettingsComponent implements OnInit {
    protected readonly media = inject(MediaService);
    protected readonly settingsService = inject(SettingsService);
    protected readonly authService = inject(AuthService);
    private readonly dialog = inject(MatDialog);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    protected readonly isMobile = this.media.isMobile;
    protected readonly isTablet = this.media.isTablet;
    protected readonly selectedTabIndex = signal<number>(0);
    protected readonly visibleTabs = computed(() =>
        SETTINGS_TABS.filter(
            (tab) => !tab.adminOnly || this.authService.authState().isAdmin,
        ),
    );

    ngOnInit(): void {
        this.settingsService.loadSettings().subscribe({ error: () => {} });
        this.route.queryParams.subscribe((params) =>
            this.applyQueryParams(params),
        );
    }

    onTabChange(index: number): void {
        const tab = this.visibleTabs()[index];
        if (!tab) return;

        this.selectedTabIndex.set(index);
        this.navigateToTab(tab.key);
    }

    private applyQueryParams(params: Params): void {
        const tabs = this.visibleTabs();
        const requestedKey = this.toSettingsTab(params['tab']);
        const requestedTab = requestedKey
            ? tabs.find((tab) => tab.key === requestedKey)
            : undefined;
        const targetTab = requestedTab ?? tabs[0];
        if (!targetTab) return;

        this.selectedTabIndex.set(tabs.indexOf(targetTab));

        if (params['tab'] && !requestedTab) {
            this.navigateToTab(targetTab.key, true);
            return;
        }

        const section = params['section'];
        if (section && targetTab.key === SettingsTab.GENERAL) {
            this.scrollToSection(section);
        }
    }

    private navigateToTab(tab: SettingsTab, replaceUrl = false): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { tab, section: null },
            queryParamsHandling: 'merge',
            replaceUrl,
        });
    }

    private toSettingsTab(value: unknown): SettingsTab | null {
        if (typeof value !== 'string') return null;

        return Object.values(SettingsTab).includes(value as SettingsTab)
            ? (value as SettingsTab)
            : null;
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
