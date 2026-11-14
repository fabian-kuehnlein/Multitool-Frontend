import {
    Component,
    ChangeDetectionStrategy,
    inject,
    OnInit,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { UI_MODULES } from '../../../../shared/utilities/material-ui';
import { AuthService } from '../../services/auth.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { LoginFormService } from './login-form.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, UI_MODULES],
    templateUrl: './login.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './login.component.scss',
    providers: [LoginFormService],
})
export class LoginComponent implements OnInit {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly snackbar = inject(SnackbarService);
    private readonly formService = inject(LoginFormService);

    protected readonly loginForm = this.formService.buildLoginForm();
    protected readonly setupForm = this.formService.buildSetupForm('');
    protected readonly mode = signal<'login' | 'setup'>('login');
    protected readonly isLoading = signal(false);
    protected readonly isSaving = signal(false);

    private temporaryPassword = '';

    ngOnInit(): void {
        const authState = this.authService.authState();

        if (authState.isAuthenticated && authState.mustChangePassword) {
            this.enterSetupMode();
        }
    }

    onSubmit(): void {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.isLoading.set(true);
        const { username, password } = this.loginForm.getRawValue();
        this.temporaryPassword = password;

        this.authService.login(username, password).subscribe({
            next: () => {
                this.isLoading.set(false);

                if (this.authService.authState().mustChangePassword) {
                    this.enterSetupMode();
                    return;
                }

                this.router.navigate(['/calendar']);
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading.set(false);
                this.temporaryPassword = '';
                if (err.status === 401) {
                    this.snackbar.openError(
                        'Login fehlgeschlagen. Bitte überprüfen Sie Ihre Zugangsdaten.',
                    );
                } else {
                    this.snackbar.openHttpError(err);
                }
                console.error('Login error:', err);
            },
        });
    }

    onSetupSubmit(): void {
        if (this.setupForm.invalid) {
            this.setupForm.markAllAsTouched();
            return;
        }

        const dto = this.formService.toUpdateCredentials(this.setupForm);

        if (dto.password === this.temporaryPassword) {
            this.snackbar.openError(
                'Das neue Passwort muss sich vom temporären Passwort unterscheiden.',
            );
            return;
        }

        this.isSaving.set(true);

        this.authService.updateCredentials(dto).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.temporaryPassword = '';
                this.snackbar.openSuccess(
                    'Zugangsdaten wurden erfolgreich geändert.',
                );
                this.router.navigate(['/calendar']);
            },
            error: (err: HttpErrorResponse) => {
                this.isSaving.set(false);

                if (err.status === 401) {
                    this.temporaryPassword = '';
                    this.loginForm.reset();
                    this.mode.set('login');
                    return;
                }

                if (err.status === 409) {
                    this.snackbar.openError(
                        'Dieser Benutzername ist bereits vergeben.',
                    );
                } else if (err.status === 400) {
                    this.snackbar.openError(
                        'Die Zugangsdaten sind ungültig. Bitte überprüfe deine Eingaben.',
                    );
                } else {
                    this.snackbar.openHttpError(err);
                }
            },
        });
    }

    onLogout(): void {
        this.authService.logout();
        this.temporaryPassword = '';
        this.loginForm.reset();
        this.mode.set('login');
    }

    private enterSetupMode(): void {
        const username = this.authService.authState().username ?? '';

        this.setupForm.reset({
            username,
            password: '',
            confirmPassword: '',
        });
        this.mode.set('setup');
    }
}
