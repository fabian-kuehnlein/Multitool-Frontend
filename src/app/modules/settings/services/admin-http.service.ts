import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    AdminUserModel,
    CreateUserDto,
    ResetPasswordDto,
    SetUserActiveDto,
} from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminHttpService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.MultitoolApi}/api/Admin`;

    getUsers(): Observable<AdminUserModel[]> {
        return this.http.get<AdminUserModel[]>(`${this.apiUrl}/users`);
    }

    createUser(dto: CreateUserDto, context?: HttpContext): Observable<number> {
        return this.http.post<number>(`${this.apiUrl}/users`, dto, { context });
    }

    resetPassword(id: number, dto: ResetPasswordDto, context?: HttpContext): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/users/${id}/password`, dto, { context });
    }

    setUserActive(id: number, dto: SetUserActiveDto, context?: HttpContext): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/users/${id}/active`, dto, { context });
    }
}
