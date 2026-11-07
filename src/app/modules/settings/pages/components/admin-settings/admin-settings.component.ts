import {
    Component,
    inject,
    OnInit,
    signal,
    computed,
    ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpContext } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import { DateUtil } from '../../../../../shared/utilities/date.util';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { MediaService } from '../../../../../core/services/media.service';
import { AuthService } from '../../../../../core/auth/services/auth.service';
import { SKIP_HTTP_ERROR_SNACKBAR } from '../../../../../core/interceptors/http-error.interceptor';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AdminService } from '../../../services/admin.service';
import { AdminUserModel, UserRole, UserRoleValue } from '../../../models/admin.model';
import {
    UserDialogComponent,
    UserDialogData,
    UserDialogResult,
} from './user-dialog/user-dialog.component';

@Component({
    selector: 'app-admin-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, UI_MODULES],
    templateUrl: './admin-settings.component.html',
    styleUrl: './admin-settings.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class AdminSettingsComponent implements OnInit {
    protected readonly adminService = inject(AdminService);
    protected readonly authService = inject(AuthService);
    private readonly snackbar = inject(SnackbarService);
    private readonly dialog = inject(MatDialog);
    protected readonly media = inject(MediaService);

    private readonly skipErrorSnackbarContext = new HttpContext().set(
        SKIP_HTTP_ERROR_SNACKBAR,
        true,
    );

    protected readonly searchQuery = signal<string>('');

    protected readonly filteredUsers = computed(() => {
        const query = this.searchQuery().trim().toLowerCase();
        const users = this.adminService.users();

        if (!query) {
            return users;
        }

        return users.filter((user) =>
            user.username.toLowerCase().includes(query),
        );
    });

    ngOnInit(): void {
        this.adminService.loadUsers();
    }

    onSearchChange(value: string): void {
        this.searchQuery.set(value);
    }

    clearSearch(): void {
        this.searchQuery.set('');
    }

    openCreateUserDialog(): void {
        this.openUserDialog({ mode: 'create' })
            .afterClosed()
            .subscribe((result) => {
                if (result?.mode !== 'create') return;

                this.adminService
                    .createUser(result.dto, this.skipErrorSnackbarContext)
                    .subscribe({
                        next: () => {
                            this.snackbar.openSuccess(
                                `Benutzer "${result.dto.username}" wurde erfolgreich erstellt.`,
                            );
                        },
                        error: () => {
                            this.snackbar.openError(
                                'Benutzer konnte nicht erstellt werden.',
                            );
                        },
                    });
            });
    }

    openResetPasswordDialog(user: AdminUserModel): void {
        this.openUserDialog({ mode: 'reset-password', user })
            .afterClosed()
            .subscribe((result) => {
                if (result?.mode !== 'reset-password') return;

                this.adminService
                    .resetPassword(
                        user.id,
                        result.dto,
                        this.skipErrorSnackbarContext,
                    )
                    .subscribe({
                        next: () => {
                            this.snackbar.openSuccess(
                                `Neues temporäres Passwort für "${user.username}" vergeben.`,
                            );
                        },
                        error: () => {
                            this.snackbar.openError(
                                'Passwort konnte nicht zurückgesetzt werden.',
                            );
                        },
                    });
            });
    }

    private openUserDialog(
        data: UserDialogData,
    ): MatDialogRef<UserDialogComponent, UserDialogResult> {
        const width = this.media.isMobile() ? '90vw' : '460px';

        return this.dialog.open<
            UserDialogComponent,
            UserDialogData,
            UserDialogResult
        >(UserDialogComponent, {
            width,
            maxWidth: width,
            maxHeight: '90vh',
            data,
        });
    }

    toggleUserActive(user: AdminUserModel): void {
        if (this.isCurrentUser(user)) return;

        const willBeActive = !user.isActive;
        const title = willBeActive
            ? 'Benutzer aktivieren'
            : 'Benutzer deaktivieren';
        const message = willBeActive
            ? `Möchtest du den Benutzer "${user.username}" wieder aktivieren?`
            : `Möchtest du den Benutzer "${user.username}" wirklich deaktivieren? Der Benutzer kann sich danach nicht mehr anmelden.`;
        const confirmText = willBeActive ? 'Aktivieren' : 'Deaktivieren';

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title,
                message,
                confirmText,
                cancelText: 'Abbrechen',
                isDestructive: !willBeActive,
            },
        });

        dialogRef.afterClosed().subscribe((confirmed) => {
            if (!confirmed) return;

            this.adminService
                .setUserActive(user.id, willBeActive, this.skipErrorSnackbarContext)
                .subscribe({
                    next: () => {
                        this.snackbar.openSuccess(
                            willBeActive
                                ? `Benutzer "${user.username}" erfolgreich aktiviert.`
                                : `Benutzer "${user.username}" erfolgreich deaktiviert.`,
                        );
                    },
                    error: () => {
                        this.snackbar.openError(
                            willBeActive
                                ? 'Benutzer konnte nicht aktiviert werden.'
                                : 'Benutzer konnte nicht deaktiviert werden.',
                        );
                    },
                });
        });
    }

    isCurrentUser(user: AdminUserModel): boolean {
        const authState = this.authService.authState();
        if (authState.userId !== null && user.id === authState.userId) {
            return true;
        }
        const currentName = authState.username;
        return (
            currentName !== null &&
            user.username.toLowerCase() === currentName.toLowerCase()
        );
    }

    isUserAdmin(role: UserRoleValue): boolean {
        return role === UserRole.ADMIN || role === 1 || role === 'Admin' || role === 'admin';
    }

    getUserRoleLabel(user: AdminUserModel): string {
        return this.isUserAdmin(user.role) ? 'Administrator' : 'Benutzer';
    }

    formatDate(dateStr: string): string {
        return DateUtil.formatDisplayDateTime(dateStr) ?? dateStr;
    }
}
