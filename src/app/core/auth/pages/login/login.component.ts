import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

import {
    FormsModule,
    ReactiveFormsModule,
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './login.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './login.component.scss',
})
export class LoginComponent {
    loginForm: FormGroup;
    isLoading = signal(false);

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private snackbar: SnackbarService,
    ) {
        this.loginForm = this.fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required],
        });
    }

    onSubmit(): void {
        if (this.loginForm.valid) {
            this.isLoading.set(true);
            const { username, password } = this.loginForm.value;
            this.authService.login(username, password).subscribe({
                next: () => {
                    this.router.navigate(['/calendar']);
                },
                error: (err: HttpErrorResponse) => {
                    this.isLoading.set(false);
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
    }
}
