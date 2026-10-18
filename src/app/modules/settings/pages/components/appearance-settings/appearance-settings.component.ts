import {
    Component,
    inject,
    computed,
    ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import { ThemeService } from '../../../../../core/services/theme.service';
import { SnackbarService } from '../../../../../core/services/snackbar.service';

@Component({
    selector: 'app-appearance-settings',
    standalone: true,
    imports: [CommonModule, UI_MODULES],
    templateUrl: './appearance-settings.component.html',
    styleUrl: './appearance-settings.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class AppearanceSettingsComponent {
    protected readonly themeService = inject(ThemeService);
    private readonly snackbar = inject(SnackbarService);

    readonly themeMode = computed<'light' | 'dark'>(() =>
        this.themeService.isDark() ? 'dark' : 'light',
    );

    onModeChange(mode: 'light' | 'dark'): void {
        if (this.themeMode() === mode) return;

        this.themeService.setDark(mode === 'dark');
        const label = mode === 'dark' ? 'Dark Mode' : 'Light Mode';
        this.snackbar.openSuccess(`Erscheinungsbild auf ${label} gewechselt`);
    }
}
