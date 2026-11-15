import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import { MediaService } from '../../../../../core/services/media.service';
import { AuthService } from '../../../../../core/auth/services/auth.service';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { AccountSettingsDialogComponent } from './account-settings-dialog/account-settings-dialog.component';

@Component({
    selector: 'app-account-settings',
    standalone: true,
    imports: [CommonModule, UI_MODULES],
    templateUrl: './account-settings.component.html',
    styleUrl: './account-settings.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class AccountSettingsComponent {
    private readonly authService = inject(AuthService);
    private readonly dialog = inject(MatDialog);
    private readonly media = inject(MediaService);
    private readonly snackbar = inject(SnackbarService);

    protected readonly authState = this.authService.authState;

    onChangeCredentials(): void {
        const dialogRef = this.dialog.open(AccountSettingsDialogComponent, {
            width: this.media.isMobile() ? '100vw' : '480px',
            height: this.media.isMobile() ? '100vh' : 'auto',
            minWidth: this.media.isMobile() ? '100vw' : 'unset',
            maxWidth: this.media.isMobile() ? '100vw' : '95vw',
            panelClass: this.media.isMobile() ? 'full-screen-dialog' : '',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result?.changed) {
                this.snackbar.openSuccess(
                    'Deine Benutzerdaten wurden aktualisiert.',
                );
            }
        });
    }
}
