import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpContext, HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';
import {
    SKIP_HTTP_ERROR_SNACKBAR,
} from '../../interceptors/http-error.interceptor';
import { AuthState } from '../models/auth-state.model';
import { JwtClaims } from '../models/jwt-claims.enum';

interface LoginResponse {
    token: string;
}

type JwtPayload = Record<string, unknown>;

const EMPTY_AUTH_STATE: AuthState = {
    isAuthenticated: false,
    isAdmin: false,
    userId: null,
    username: null,
};

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

    // The stored token is the single source of truth; claims and derived
    // auth state are computed from it so they cannot drift apart.
    private readonly _token = signal<string | null>(this.readToken());
    private readonly _payload = computed(() => this.decodeToken(this._token()));

    public readonly authState = computed<AuthState>(() => {
        const payload = this._payload();
        if (!this.isPayloadValid(payload)) {
            return EMPTY_AUTH_STATE;
        }

        return {
            isAuthenticated: true,
            isAdmin: this.extractIsAdmin(payload),
            userId: this.extractUserId(payload),
            username: this.extractUsername(payload),
        };
    });

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
                    this.updateAuthState();
                }),
            );
    }

    logout(): void {
        this.removeToken();
        this.updateAuthState();
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return this._token();
    }

    setToken(token: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);
        this._token.set(token);
    }

    isLoggedIn(): boolean {
        this.updateAuthState();
        return this.authState().isAuthenticated;
    }

    private updateAuthState(): void {
        const token = this.readToken();
        if (token !== this._token()) {
            this._token.set(token);
        }

        if (this._token() !== null && !this.isPayloadValid(this._payload())) {
            this.removeToken();
        }
    }

    private removeToken(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        this._token.set(null);
    }

    private readToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    private isPayloadValid(payload: JwtPayload | null): payload is JwtPayload {
        if (!payload) return false;

        const expiry = payload[JwtClaims.EXPIRY];
        if (typeof expiry !== 'number') return false;

        return Math.floor(Date.now() / 1000) < expiry;
    }

    private extractIsAdmin(payload: JwtPayload): boolean {
        const role =
            payload[JwtClaims.ROLE] ??
            payload[JwtClaims.ROLE_MICROSOFT] ??
            payload[JwtClaims.ROLE_CAPITALIZED];
        return role === 'Admin' || role === 'admin' || role === 1;
    }

    private extractUserId(payload: JwtPayload): number | null {
        const idRaw =
            payload[JwtClaims.USER_ID] ??
            payload[JwtClaims.USER_ID_MICROSOFT] ??
            payload[JwtClaims.SUBJECT];
        const id = Number(idRaw);
        return Number.isFinite(id) ? id : null;
    }

    private extractUsername(payload: JwtPayload): string | null {
        const name =
            payload[JwtClaims.USERNAME] ??
            payload[JwtClaims.USERNAME_MICROSOFT] ??
            payload[JwtClaims.NAME];
        return typeof name === 'string' ? name : null;
    }

    private decodeToken(token: string | null): JwtPayload | null {
        if (!token) return null;

        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;

            const base64Payload = parts[1]
                .replace(/-/g, '+')
                .replace(/_/g, '/');
            return JSON.parse(atob(base64Payload)) as JwtPayload;
        } catch {
            return null;
        }
    }
}
