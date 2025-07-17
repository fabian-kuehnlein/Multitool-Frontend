import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
    private readonly _snackbar = inject(MatSnackBar);

    openSnackbar(err: any) {
        if (err.status >= 400 && err.status < 500) {
            this.snackbar400();
        } else if (err.status >= 500 && err.status < 600) {
            this.snackbar500();
        } else {
            this.snackbarUnknown();
        }
    }

    snackbar400() {
        this._snackbar.open(
            "Ein Problem in deiner Anfrage ist aufgetreten. Bitte prüfe deine Eingaben und versuche es erneut!"
        )
    }

    snackbar500() {
        this._snackbar.open(
            "Der angefragte Service ist gerade nicht erreichbar. Bitte versuche es zu einem anderen Zeitpunkt erneut!"
        )
    }

    snackbarUnknown() {
        this._snackbar.open(
            "Es ist ein unbekannter Fehler aufgetreten. Bitte versuche es später erneut!"
        )
    }
}
