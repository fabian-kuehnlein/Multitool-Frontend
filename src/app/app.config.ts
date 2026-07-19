import {
    ApplicationConfig,
    provideZonelessChangeDetection,
    LOCALE_ID,
    Injectable,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import {
    provideHttpClient,
    withFetch,
    withInterceptors,
} from '@angular/common/http';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { authInterceptor } from './core/auth/interceptors/auth.interceptor';
import dayjs from 'dayjs';
import 'dayjs/locale/de';
import { provideDayjsAdapter } from './core/date/dayjs-adapter';

dayjs.locale('de');

registerLocaleData(localeDe, 'de');

@Injectable()
export class GermanPaginatorIntl extends MatPaginatorIntl {
    override itemsPerPageLabel = 'Elemente pro Seite:';
    override nextPageLabel = 'Nächste Seite';
    override previousPageLabel = 'Vorige Seite';
    override firstPageLabel = 'Erste Seite';
    override lastPageLabel = 'Letzte Seite';

    override getRangeLabel = (
        page: number,
        pageSize: number,
        length: number,
    ) => {
        if (!length || pageSize === 0) return `0 von ${length}`;
        const start = page * pageSize + 1;
        const end = Math.min(length, (page + 1) * pageSize);
        return `${start} - ${end} von ${length}`;
    };
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideAnimationsAsync(),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
        provideDayjsAdapter(),
        { provide: LOCALE_ID, useValue: 'de' },
        { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { autoFocus: false } },
        { provide: MatPaginatorIntl, useClass: GermanPaginatorIntl },
        {
            provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
            useValue: {
                duration: 5000,
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: ['error-snackbar', 'multiline-snackbar'],
            },
        },
    ],
};
