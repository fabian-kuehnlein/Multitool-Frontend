import { Component, inject, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common'
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SearchResult } from '../../../models/search-result.model';
import { CalendarService } from '../../../services/calendar.service';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
// Third Party
import moment from 'moment';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { FormControl } from '@angular/forms';
import { CalendarMapper } from '../../../utilities/calendar-mapper';

@Component({
    selector: 'app-search-dialog',
    imports: [
        UI_MODULES,
        MatTableModule,
        DatePipe,
        MatProgressSpinnerModule
    ],
    templateUrl: './search-dialog.component.html',
    styleUrl: './search-dialog.component.scss'
})
export class SearchDialogComponent implements OnDestroy {
    private readonly calendarService = inject(CalendarService);
    private readonly dialogData = inject(MAT_DIALOG_DATA) as string;
    private dialogRef = inject(MatDialogRef<SearchDialogComponent>);
    public dialog = inject(MatDialog);
    private destroy$ = new Subject<void>();

    public readonly displayedColumns: string[] = ['eventTitle', 'eventNote', 'startDateTime', 'actions'];
    public dataSource: MatTableDataSource<SearchResult> = new MatTableDataSource<SearchResult>([]);
    public readonly isLoading = signal<boolean>(false);

    searchControl = new FormControl<string>(this.dialogData || '');

    private readonly searchTerm = toSignal(
        this.searchControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ),
        { initialValue: this.dialogData || '' }
    );

    constructor() {
        effect(() => {
            this.fetchEvents(this.searchTerm() ?? '');
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    fetchEvents(searchTerm: string) {
        if (!searchTerm || searchTerm.trim().length === 0) {
            this.dataSource.data = [];
            this.isLoading.set(false);
            return;
        }

        this.isLoading.set(true);
        this.calendarService.searchEvents(searchTerm).subscribe({
            next: (events) => {
                if (events) {
                    const processed = events.map(event => {
                        // Strip 'Z' to treat as local time and avoid timezone shifts
                        const cleanStart = event.startDateTime?.replace('Z', '');
                        const cleanEnd = event.recurrenceEnd?.replace('Z', '');
                        
                        let displayDate = cleanStart;
                        let isNextOccurrence = false;

                        if (event.recurrenceRule && cleanStart) {
                            const next = this.calculateNextOccurrence(
                                cleanStart, 
                                event.recurrenceRule, 
                                cleanEnd || null
                            );
                            if (next) {
                                displayDate = next.format('YYYY-MM-DDTHH:mm:ss');
                                isNextOccurrence = true;
                            }
                        }

                        return {
                            ...event,
                            displayDate,
                            isNextOccurrence
                        };
                    });

                    const sortedEvents = processed.sort((a, b) => 
                        new Date(a.displayDate ?? '').getTime() - new Date(b.displayDate ?? '').getTime()
                    );
                    this.dataSource.data = sortedEvents;
                } else {
                    this.dataSource.data = [];
                }
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Search failed', error);
                this.dataSource.data = [];
                this.isLoading.set(false);
            }
        });
    }

    private calculateNextOccurrence(start: string, ruleStr: string, end: string | null): moment.Moment | null {
        const startDate = moment(start);
        const today = moment().startOf('day');

        // If it's already in the future, return the start date
        if (startDate.isSameOrAfter(today)) {
            return startDate;
        }

        const rule = CalendarMapper.parseRRuleString(ruleStr);
        const rrule = {
            dtstart: start,
            until: end,
            ...rule
        };

        const maxSearchDate = moment().add(2, 'years');
        let current = moment(today);

        while (current.isBefore(maxSearchDate)) {
            if (CalendarMapper.eventFallsOnDate(rrule, current)) {
                // Return current date but keep the original start time
                return current.set({
                    hour: startDate.hour(),
                    minute: startDate.minute(),
                    second: startDate.second()
                });
            }
            current.add(1, 'day');
        }

        return null;
    }

    goToDate(element: any) {
        const dateToUse = element.displayDate || element.startDateTime;
        if (dateToUse) {
            this.dialogRef.close({ data: moment(dateToUse).format('YYYY-MM-DD') });
        }
    }

    delete(deleteId: string) {
        if (deleteId) {
            this.dialog.open(ConfirmDialogComponent, {
                data: {
                    title: 'Ereignis löschen',
                    message: 'Möchten Sie dieses Ereignis wirklich löschen?',
                    confirmText: 'Löschen',
                    isDestructive: true
                }
            })
            .afterClosed().subscribe(result => {
                if (result) {
                    this.calendarService.deleteEvent(deleteId).subscribe({
                        next: () => {
                            this.dataSource.data = this.dataSource.data.filter(event => event.eventId !== deleteId);
                        },
						error: (error: any) => {
                            console.error('Error deleting event:', error);
						}
					});
                }
            });
        }
    }

    close() {
        this.dialogRef.close(null);
    }
}
