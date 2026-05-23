import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID, Injectable } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideMomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { routes } from './app.routes';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { authInterceptor } from './core/auth/interceptors/auth.interceptor';
import moment from 'moment';
import 'moment/locale/de';

moment.locale('de');

registerLocaleData(localeDe, 'de');

@Injectable()
export class GermanPaginatorIntl extends MatPaginatorIntl {
    override itemsPerPageLabel = 'Elemente pro Seite:';
    override nextPageLabel     = 'Nächste Seite';
    override previousPageLabel = 'Vorige Seite';
    override firstPageLabel    = 'Erste Seite';
    override lastPageLabel     = 'Letzte Seite';

    override getRangeLabel = (page: number, pageSize: number, length: number) => {
        if (!length || pageSize === 0) return `0 von ${length}`;
        const start = page * pageSize + 1;
        const end   = Math.min(length, (page + 1) * pageSize);
        return `${start} - ${end} von ${length}`;
    };
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
        provideMomentDateAdapter({
            parse: {
                dateInput: ['DD.MM.YYYY', 'D.M.YYYY'],
                timeInput: 'HH:mm'
            },
            display: {
                dateInput: 'DD.MM.YYYY',
                monthYearLabel: 'MMM YYYY',
                dateA11yLabel: 'LL',
                monthYearA11yLabel: 'MMMM YYYY',

                timeInput: 'HH:mm',
                timeOptionLabel: 'HH:mm'
            },
        }),
        { provide: LOCALE_ID, useValue: 'de' },
        { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: false }},
        { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { autoFocus: false }},
        { provide: MatPaginatorIntl, useClass: GermanPaginatorIntl },
        { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
            useValue: {
                duration: 5000,
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: ['error-snackbar', 'multiline-snackbar']
            }
        }
    ]
};

