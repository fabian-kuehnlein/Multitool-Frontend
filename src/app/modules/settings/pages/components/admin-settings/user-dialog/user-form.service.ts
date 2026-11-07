import { Injectable, inject } from '@angular/core';
import {
    FormBuilder,
    FormControl,
    FormGroup,
    Validators,
} from '@angular/forms';
import {
    CreateUserDto,
    ResetPasswordDto,
    UserRole,
} from '../../../../models/admin.model';
import { generateTemporaryPassword } from '../../../../logic/password.logic';

export type UserDialogMode = 'create' | 'reset-password';

export interface UserForm {
    username: FormControl<string>;
    password: FormControl<string>;
    role: FormControl<UserRole>;
}

@Injectable()
export class UserFormService {
    private readonly fb = inject(FormBuilder);

    buildForm(mode: UserDialogMode): FormGroup<UserForm> {
        const form = this.fb.group<UserForm>({
            username: this.fb.control('', {
                nonNullable: true,
                validators: [
                    Validators.required,
                    Validators.minLength(3),
                    Validators.maxLength(50),
                    Validators.pattern(/^[a-zA-Z0-9._-]+$/),
                ],
            }),
            password: this.fb.control(generateTemporaryPassword(), {
                nonNullable: true,
                validators: [Validators.required, Validators.minLength(6)],
            }),
            role: this.fb.control(UserRole.USER, {
                nonNullable: true,
                validators: [Validators.required],
            }),
        });

        // The reset dialog only edits the password; hidden controls must not
        // block the form's validity.
        if (mode === 'reset-password') {
            form.controls.username.disable();
            form.controls.role.disable();
        }

        return form;
    }

    toCreateDto(form: FormGroup<UserForm>): CreateUserDto {
        const value = form.getRawValue();
        return {
            username: value.username.trim(),
            password: value.password,
            role: Number(value.role) as UserRole,
        };
    }

    toResetPasswordDto(form: FormGroup<UserForm>): ResetPasswordDto {
        return { password: form.controls.password.value };
    }
}
