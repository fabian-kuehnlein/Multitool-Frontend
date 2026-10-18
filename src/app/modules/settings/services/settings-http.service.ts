import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SettingsDto, UpdateSettingDto } from '../models/settings.model';

@Injectable({
    providedIn: 'root',
})
export class SettingsHttpService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.MultitoolApi}/api/Settings`;

    getSettings(): Observable<SettingsDto> {
        return this.http.get<SettingsDto>(this.apiUrl);
    }

    updateSetting(
        module: string,
        key: string,
        dto: UpdateSettingDto,
    ): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${module}/${key}`, dto);
    }
}
