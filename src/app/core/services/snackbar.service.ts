import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
    private readonly _snackbar = inject(MatSnackBar);

    openSuccess(message: string) {
        this._snackbar.open(message, 'X', {
            duration: 3000,
            panelClass: ['success-snackbar']
        });
    }

    openError(message: string) {
        this._snackbar.open(message, 'X', {
            duration: 5000,
            panelClass: ['error-snackbar']
        });
    }

    openSnackbar(err: any) {
        if (err.status >= 400 && err.status < 500) {
            this.snackbar400();
        } else if (err.status >= 500 && err.status < 600) {
            this.snackbar500();
        } else if (err.status === 0) {
            this.snackbarConnectionError();
        } else {
            this.snackbarUnknown(err.message);
        }
    }

    snackbar400() {
        this._snackbar.open(
            `Ein Problem in deiner Anfrage ist aufgetreten.
            Bitte prüfe deine Eingaben und versuche es erneut!`,
            'Close', { duration: 5000 }
        )
    }

    snackbar500() {
        this._snackbar.open(
            `Der angefragte Service ist gerade nicht erreichbar.
            Bitte versuche es zu einem anderen Zeitpunkt erneut!`,
            'Close', { duration: 5000 }
        )
    }

    snackbarConnectionError() {
        this._snackbar.open(
            `Es konnte keine Verbindung zum Server hergestellt werden.
            Bitte prüfe deine Internetverbindung und versuche es erneut!`,
            'Close', { duration: 5000 }
        )
    }

    snackbarUnknown(message: string) {
        this._snackbar.open(
            `Ein unbekannter Fehler ist aufgetreten: ${message}`,
            'Close', { duration: 5000 }
        )
    }
}
