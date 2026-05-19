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
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

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
                    const sortedEvents = events.sort((a, b) => 
                        new Date(a.startDateTime ?? '').getTime() - new Date(b.startDateTime ?? '').getTime()
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

    goToDate(date: string) {
        if (date) {
            this.dialogRef.close({ data: date })
        } else {
            this.dialogRef.close(null);
        }
    }

    delete(deleteId: string) {
        if (deleteId) {
            this.dialog.open(ConfirmDialogComponent).afterClosed().subscribe(result => {
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
