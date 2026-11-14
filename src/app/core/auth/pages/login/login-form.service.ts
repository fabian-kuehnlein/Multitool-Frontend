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
import { UpdateCredentialsDto } from '../../models/update-credentials.model';

export interface LoginForm {
    username: FormControl<string>;
    password: FormControl<string>;
}

export interface SetupForm {
    username: FormControl<string>;
    password: FormControl<string>;
    confirmPassword: FormControl<string>;
}

const passwordsMatch: ValidatorFn = (
    group: AbstractControl,
): ValidationErrors | null => {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
};

@Injectable()
export class LoginFormService {
    private readonly fb = inject(FormBuilder);

    buildLoginForm(): FormGroup<LoginForm> {
        return this.fb.group<LoginForm>({
            username: this.fb.control('', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            password: this.fb.control('', {
                nonNullable: true,
                validators: [Validators.required],
            }),
        });
    }

    buildSetupForm(username: string): FormGroup<SetupForm> {
        return this.fb.group<SetupForm>(
            {
                username: this.fb.control(username, {
                    nonNullable: true,
                    validators: [
                        Validators.required,
                        Validators.minLength(3),
                        Validators.maxLength(50),
                        Validators.pattern(/^[a-zA-Z0-9._-]+$/),
                    ],
                }),
                password: this.fb.control('', {
                    nonNullable: true,
                    validators: [Validators.required, Validators.minLength(6)],
                }),
                confirmPassword: this.fb.control('', {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
            },
            { validators: passwordsMatch },
        );
    }

    toUpdateCredentials(form: FormGroup<SetupForm>): UpdateCredentialsDto {
        const value = form.getRawValue();

        return {
            username: value.username.trim(),
            password: value.password,
        };
    }
}
