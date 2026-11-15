import {
    ChangeDetectionStrategy,
    Component,
    inject,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { UI_MODULES } from '../../../../../../shared/utilities/material-ui';
import { AuthService } from '../../../../../../core/auth/services/auth.service';
import { SnackbarService } from '../../../../../../core/services/snackbar.service';
import { VerifyAccountCredentialsDto } from '../../../../../../core/auth/models/verify-account-credentials-dto.model';
import {
    AccountSettingsDialogFormService,
    EditCredentialsForm,
} from './account-settings-dialog-form.service';

export interface AccountSettingsDialogResult {
    changed: boolean;
}

@Component({
    selector: 'app-account-settings-dialog',
    standalone: true,
    imports: [CommonModule, UI_MODULES],
    providers: [AccountSettingsDialogFormService],
    templateUrl: './account-settings-dialog.component.html',
    styleUrl: './account-settings-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class AccountSettingsDialogComponent {
    private readonly authService = inject(AuthService);
    private readonly snackbar = inject(SnackbarService);
    private readonly formService = inject(AccountSettingsDialogFormService);
    private readonly dialogRef = inject<
        MatDialogRef<AccountSettingsDialogComponent, AccountSettingsDialogResult>
    >(MatDialogRef);

    protected readonly step = signal<'verify' | 'edit'>('verify');
    protected readonly verifyForm = this.formService.buildVerifyForm(
        this.authService.authState().username ?? '',
    );
    protected readonly editForm =
        signal<FormGroup<EditCredentialsForm> | null>(null);
    protected readonly isVerifying = signal(false);
    protected readonly isSaving = signal(false);

    onVerify(): void {
        if (this.verifyForm.invalid) {
            this.verifyForm.markAllAsTouched();
            return;
        }

        const dto = this.formService.toVerifyDto(this.verifyForm);
        this.isVerifying.set(true);

        this.authService
            .verifyCredentials(dto)
            .pipe(finalize(() => this.isVerifying.set(false)))
            .subscribe({
                next: () => this.startEditStep(dto),
                error: (err: HttpErrorResponse) => this.handleError(err, true),
            });
    }

    onSave(): void {
        const form = this.editForm();
        if (!form) return;

        if (form.invalid) {
            form.markAllAsTouched();
            return;
        }

        const dto = this.formService.toChangeDto(
            form,
            this.verifyForm.controls.username.value.trim(),
            this.verifyForm.controls.password.value,
        );
        this.isSaving.set(true);

        this.authService
            .changeCredentials(dto)
            .pipe(finalize(() => this.isSaving.set(false)))
            .subscribe({
                next: () => this.dialogRef.close({ changed: true }),
                error: (err: HttpErrorResponse) => this.handleError(err, false),
            });
    }

    onBack(): void {
        this.step.set('verify');
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    private startEditStep(verified: VerifyAccountCredentialsDto): void {
        this.editForm.set(
            this.formService.buildEditForm(
                verified.username,
                verified.password,
            ),
        );
        this.step.set('edit');
    }

    private handleError(err: HttpErrorResponse, isVerifyStep: boolean): void {
        if (err.status === 401) {
            // The auth interceptor already logs the user out on 401.
            return;
        }

        if (err.status === 409) {
            this.snackbar.openError(
                'Dieser Benutzername ist bereits vergeben.',
            );
            return;
        }

        if (err.status === 400) {
            this.snackbar.openError(
                isVerifyStep
                    ? 'Benutzername oder Passwort ist falsch.'
                    : 'Das aktuelle Passwort ist falsch.',
            );
            return;
        }

        this.snackbar.openHttpError(err);
    }
}
