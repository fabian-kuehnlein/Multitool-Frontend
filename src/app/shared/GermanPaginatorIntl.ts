import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

@Injectable({ providedIn: 'root' })
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
