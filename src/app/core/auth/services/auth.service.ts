import { inject, Injectable, signal } from '@angular/core';
import { HttpContext, HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';
import {
    SKIP_HTTP_ERROR_SNACKBAR,
} from '../../interceptors/http-error.interceptor';

interface LoginResponse {
    token: string;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly TOKEN_KEY = 'auth_token';
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);
    private readonly apiUrl = `${environment.MultitoolApi}/api/Auth`;
    private readonly skipErrorSnackbarContext = new HttpContext().set(
        SKIP_HTTP_ERROR_SNACKBAR,
        true,
    );

    public readonly isAuthenticated = signal<boolean>(
        this.checkTokenValidity(),
    );

    login(username: string, password: string): Observable<LoginResponse> {
        return this.http
            .post<LoginResponse>(
                `${this.apiUrl}/login`,
                { username, password },
                { context: this.skipErrorSnackbarContext },
            )
            .pipe(
                tap((response) => {
                    this.setToken(response.token);
                    this.isAuthenticated.set(true);
                }),
            );
    }

    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        this.isAuthenticated.set(false);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    setToken(token: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    isLoggedIn(): boolean {
        const isValid = this.checkTokenValidity();
        if (this.isAuthenticated() !== isValid) {
            this.isAuthenticated.set(isValid);
        }
        return isValid;
    }

    private checkTokenValidity(): boolean {
        const token = this.getToken();
        if (!token) return false;

        try {
            const parts = token.split('.');
            if (parts.length !== 3) return false;

            const base64Payload = parts[1]
                .replace(/-/g, '+')
                .replace(/_/g, '/');
            const payload = JSON.parse(atob(base64Payload));
            const expiry = payload.exp;
            const now = Math.floor(Date.now() / 1000);

            if (now >= expiry) {
                this.clearToken();
                return false;
            }
            return true;
        } catch (e) {
            this.clearToken();
            return false;
        }
    }

    private clearToken(): void {
        localStorage.removeItem(this.TOKEN_KEY);
    }
}
