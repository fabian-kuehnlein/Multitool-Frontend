import {
    Component,
    inject,
    computed,
    ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import { ThemeMode, ThemeService } from '../../../../../core/services/theme.service';
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

    readonly selectedMode = computed<ThemeMode>(() => this.themeService.mode());

    onModeChange(mode: ThemeMode): void {
        if (this.selectedMode() === mode) {
            return;
        }

        this.themeService.setMode(mode);

        const label =
            mode === 'system'
                ? 'Systemeinstellung'
                : mode === 'dark'
                  ? 'Dark Mode'
                  : 'Light Mode';

        this.snackbar.openSuccess(`Erscheinungsbild auf ${label} gewechselt`);
    }
}
