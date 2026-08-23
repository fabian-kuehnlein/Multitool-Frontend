import {
    Component,
    inject,
    OnDestroy,
    signal,
    effect,
    ChangeDetectionStrategy,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import {
    SearchResult,
    SearchResultRow,
} from '../../../models/search-result.model';
import { CalendarService } from '../../../services/calendar.service';
import {
    MAT_DIALOG_DATA,
    MatDialogRef,
    MatDialog,
} from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
// Third Party
import dayjs from 'dayjs';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { FormControl } from '@angular/forms';
import { getNextOccurrence } from '../../../logic/rrule.logic';

@Component({
    selector: 'app-search-dialog',
    standalone: true,
    imports: [UI_MODULES, DatePipe],
    templateUrl: './search-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './search-dialog.component.scss',
})
export class SearchDialogComponent implements OnDestroy {
    private readonly calendarService = inject(CalendarService);
    private readonly dialogRef = inject(MatDialogRef<SearchDialogComponent>);
    private readonly dialog = inject(MatDialog);
    private readonly snackbar = inject(SnackbarService);
    private readonly dialogData = inject(MAT_DIALOG_DATA) as string;

    public readonly results = signal<SearchResultRow[]>([]);
    public readonly isLoading = signal<boolean>(false);

    public readonly searchControl = new FormControl<string>(
        this.dialogData || '',
    );

    private readonly searchTerm = toSignal(
        this.searchControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
        ),
        { initialValue: this.dialogData || '' },
    );

    constructor() {
        effect(() => {
            this.fetchEvents(this.searchTerm() ?? '');
        });
    }

    ngOnDestroy() {}

    fetchEvents(searchTerm: string) {
        if (!searchTerm || searchTerm.trim().length === 0) {
            this.results.set([]);
            this.isLoading.set(false);
            return;
        }

        this.isLoading.set(true);
        this.calendarService.searchEvents(searchTerm).subscribe({
            next: (events) => {
                const processed = (events ?? []).map((event) =>
                    this.toSearchResultRow(event),
                );
                processed.sort(
                    (a, b) =>
                        dayjs(a.displayDate).valueOf() -
                        dayjs(b.displayDate).valueOf(),
                );
                this.results.set(processed);
                this.isLoading.set(false);
            },
            error: () => {
                this.snackbar.openError('Die Suche ist fehlgeschlagen.');
                this.results.set([]);
                this.isLoading.set(false);
            },
        });
    }

    private toSearchResultRow(event: SearchResult): SearchResultRow {
        // Strip 'Z' to treat as local time and avoid timezone shifts
        const cleanStart = event.startDateTime?.replace('Z', '');
        const cleanEnd = event.recurrenceEnd?.replace('Z', '');

        let displayDate = cleanStart ?? null;
        let isNextOccurrence = false;

        if (event.recurrenceRule && cleanStart) {
            const next = getNextOccurrence(
                cleanStart,
                event.recurrenceRule,
                cleanEnd || null,
            );
            if (next) {
                displayDate = next.format('YYYY-MM-DDTHH:mm:ss');
                isNextOccurrence = true;
            }
        }

        return { ...event, displayDate, isNextOccurrence };
    }

    goToDate(element: SearchResultRow) {
        const dateToUse = element.displayDate || element.startDateTime;
        if (dateToUse) {
            this.dialogRef.close({
                data: dayjs(dateToUse).format('YYYY-MM-DD'),
            });
        }
    }

    delete(deleteId: number) {
        if (deleteId == null) return;

        this.dialog
            .open(ConfirmDialogComponent, {
                data: {
                    title: 'Ereignis löschen',
                    message: 'Möchtest du dieses Ereignis wirklich löschen?',
                    confirmText: 'Löschen',
                    isDestructive: true,
                },
            })
            .afterClosed()
            .subscribe((result) => {
                if (result) {
                    this.calendarService.deleteEvent(deleteId).subscribe({
                        next: () => {
                            this.results.update((rows) =>
                                rows.filter((row) => row.eventId !== deleteId),
                            );
                            this.snackbar.openSuccess('Ereignis gelöscht.');
                        },
                        error: () =>
                            this.snackbar.openError(
                                'Das Ereignis konnte nicht gelöscht werden.',
                            ),
                    });
                }
            });
    }

    close() {
        this.dialogRef.close(null);
    }
}