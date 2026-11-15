import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UI_MODULES } from '../../../../../../shared/utilities/material-ui';
import { SnackbarService } from '../../../../../../core/services/snackbar.service';
import {
    AdminUserModel,
    CreateUserDto,
    ResetPasswordDto,
    UserRole,
} from '../../../../models/admin.model';
import { generateTemporaryPassword } from '../../../../logic/password.logic';
import { UserFormService } from './user-form.service';

export type UserDialogData =
    | { mode: 'create' }
    | { mode: 'reset-password'; user: AdminUserModel };

export type UserDialogResult =
    | { mode: 'create'; dto: CreateUserDto }
    | { mode: 'reset-password'; dto: ResetPasswordDto };

@Component({
    selector: 'app-user-dialog',
    standalone: true,
    imports: [CommonModule, UI_MODULES],
    providers: [UserFormService],
    templateUrl: './user-dialog.component.html',
    styleUrl: './user-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class UserDialogComponent {
    private readonly dialogRef = inject<
        MatDialogRef<UserDialogComponent, UserDialogResult>
    >(MatDialogRef);
    private readonly formService = inject(UserFormService);
    private readonly snackbar = inject(SnackbarService);
    private readonly data = inject<UserDialogData>(MAT_DIALOG_DATA);

    protected readonly isCreateMode = this.data.mode === 'create';
    protected readonly targetUser =
        this.data.mode === 'reset-password' ? this.data.user : null;
    protected readonly form = this.formService.buildForm(this.data.mode);
    protected readonly passwordCopied = signal<boolean>(false);

    protected readonly roles = [
        { value: UserRole.USER, label: 'Benutzer' },
        { value: UserRole.ADMIN, label: 'Administrator' },
    ];

    generateNewPassword(): void {
        this.form.controls.password.setValue(generateTemporaryPassword());
        this.passwordCopied.set(false);
    }

    async copyPassword(): Promise<void> {
        const password = this.form.controls.password.value;
        if (!password) return;

        try {
            await navigator.clipboard.writeText(password);
            this.passwordCopied.set(true);
            setTimeout(() => this.passwordCopied.set(false), 2000);
            this.snackbar.openSuccess('Passwort wurde in die Zwischenablage kopiert.');
        } catch {
            this.passwordCopied.set(false);
            this.snackbar.openError('Passwort konnte nicht kopiert werden.');
        }
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        if (this.data.mode === 'create') {
            this.dialogRef.close({
                mode: 'create',
                dto: this.formService.toCreateDto(this.form),
            });
            return;
        }

        this.dialogRef.close({
            mode: 'reset-password',
            dto: this.formService.toResetPasswordDto(this.form),
        });
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
