import { inject, Injectable } from '@angular/core';
import {
    AbstractControl,
    FormBuilder,
    FormControl,
    FormGroup,
    ValidationErrors,
    ValidatorFn,
    Validators,
} from '@angular/forms';
import { ChangeAccountCredentialsDto } from '../../../../../../core/auth/models/change-account-credentials-dto.model';
import { VerifyAccountCredentialsDto } from '../../../../../../core/auth/models/verify-account-credentials-dto.model';

export interface VerifyCredentialsForm {
    username: FormControl<string>;
    password: FormControl<string>;
}

export interface EditCredentialsForm {
    newUsername: FormControl<string>;
    newPassword: FormControl<string>;
    confirmPassword: FormControl<string>;
}

// The new password is optional; only enforce a length once one is entered.
const optionalMinLength =
    (minLength: number): ValidatorFn =>
    (control: AbstractControl): ValidationErrors | null => {
        const value = control.value as string;
        if (!value) return null;

        return value.length >= minLength
            ? null
            : {
                  minlength: {
                      requiredLength: minLength,
                      actualLength: value.length,
                  },
              };
    };

const passwordsMatch: ValidatorFn = (
    group: AbstractControl,
): ValidationErrors | null => {
    const newPassword = group.get('newPassword')?.value ?? '';
    const confirmPassword = group.get('confirmPassword')?.value ?? '';

    if (!newPassword && !confirmPassword) return null;

    return newPassword === confirmPassword ? null : { passwordMismatch: true };
};

const newPasswordDiffersFromCurrent =
    (currentPassword: string): ValidatorFn =>
    (group: AbstractControl): ValidationErrors | null => {
        const newPassword = group.get('newPassword')?.value ?? '';
        if (!newPassword) return null;

        return newPassword === currentPassword
            ? { passwordUnchanged: true }
            : null;
    };

const atLeastOneChange =
    (currentUsername: string): ValidatorFn =>
    (group: AbstractControl): ValidationErrors | null => {
        const newUsername = (group.get('newUsername')?.value ?? '').trim();
        const newPassword = group.get('newPassword')?.value ?? '';

        return newUsername !== currentUsername || !!newPassword
            ? null
            : { noChanges: true };
    };

@Injectable()
export class AccountSettingsDialogFormService {
    private readonly fb = inject(FormBuilder);

    buildVerifyForm(username: string): FormGroup<VerifyCredentialsForm> {
        return this.fb.group<VerifyCredentialsForm>({
            username: this.fb.control(username, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            password: this.fb.control('', {
                nonNullable: true,
                validators: [Validators.required],
            }),
        });
    }

    buildEditForm(
        currentUsername: string,
        currentPassword: string,
    ): FormGroup<EditCredentialsForm> {
        return this.fb.group<EditCredentialsForm>(
            {
                newUsername: this.fb.control(currentUsername, {
                    nonNullable: true,
                    validators: [
                        Validators.required,
                        Validators.minLength(3),
                        Validators.maxLength(50),
                        Validators.pattern(/^[a-zA-Z0-9._-]+$/),
                    ],
                }),
                newPassword: this.fb.control('', {
                    nonNullable: true,
                    validators: [optionalMinLength(6)],
                }),
                confirmPassword: this.fb.control('', {
                    nonNullable: true,
                }),
            },
            {
                validators: [
                    passwordsMatch,
                    newPasswordDiffersFromCurrent(currentPassword),
                    atLeastOneChange(currentUsername),
                ],
            },
        );
    }

    toVerifyDto(
        form: FormGroup<VerifyCredentialsForm>,
    ): VerifyAccountCredentialsDto {
        return {
            username: form.controls.username.value.trim(),
            password: form.controls.password.value,
        };
    }

    toChangeDto(
        form: FormGroup<EditCredentialsForm>,
        currentUsername: string,
        currentPassword: string,
    ): ChangeAccountCredentialsDto {
        const newUsername = form.controls.newUsername.value.trim();
        const newPassword = form.controls.newPassword.value;

        return {
            currentPassword,
            newUsername:
                newUsername !== currentUsername ? newUsername : undefined,
            newPassword: newPassword || undefined,
        };
    }
}
