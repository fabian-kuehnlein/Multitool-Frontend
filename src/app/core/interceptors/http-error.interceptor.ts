import {
    HttpErrorResponse,
    HttpInterceptorFn,
    HttpContextToken,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SnackbarService } from '../services/snackbar.service';

/**
 * Opt-out flag for the generic HTTP error snackbar.
 *
 * The `httpErrorInterceptor` shows a generic, status-based error snackbar for
 * every failed HTTP request. Set this token on a request whose errors are
 * already handled with a specific, user-facing message to avoid showing two
 * snackbars for the same failure.
 */
export const SKIP_HTTP_ERROR_SNACKBAR = new HttpContextToken<boolean>(
    () => false,
);

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
    const snackbar = inject(SnackbarService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (!req.context.get(SKIP_HTTP_ERROR_SNACKBAR) && error.status !== 401) {
                snackbar.openHttpError(error);
            }
            return throwError(() => error);
        }),
    );
};
