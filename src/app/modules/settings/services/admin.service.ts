import { Injectable, inject, signal } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, finalize, tap } from 'rxjs';
import { AdminHttpService } from './admin-http.service';
import {
    AdminUserModel,
    CreateUserDto,
    ResetPasswordDto,
    SetUserActiveDto,
} from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
    private readonly httpService = inject(AdminHttpService);

    private readonly _users = signal<AdminUserModel[]>([]);
    private readonly _loading = signal<boolean>(false);

    readonly users = this._users.asReadonly();
    readonly loading = this._loading.asReadonly();

    loadUsers(): void {
        this._loading.set(true);
        this.httpService
            .getUsers()
            .pipe(finalize(() => this._loading.set(false)))
            .subscribe({
                next: (users) => this._users.set(users),
                error: () => {},
            });
    }

    createUser(dto: CreateUserDto, context?: HttpContext): Observable<number> {
        return this.httpService.createUser(dto, context).pipe(
            tap(() => {
                this.loadUsers();
            }),
        );
    }

    resetPassword(id: number, dto: ResetPasswordDto, context?: HttpContext): Observable<void> {
        return this.httpService.resetPassword(id, dto, context);
    }

    setUserActive(id: number, isActive: boolean, context?: HttpContext): Observable<void> {
        const dto: SetUserActiveDto = { isActive };
        return this.httpService.setUserActive(id, dto, context).pipe(
            tap(() => {
                this._users.update((users) =>
                    users.map((u) => (u.id === id ? { ...u, isActive } : u)),
                );
            }),
        );
    }
}
