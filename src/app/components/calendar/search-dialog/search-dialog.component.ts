import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common'
import { UI_MODULES } from '../../../shared/material-ui';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { SearchResult } from '../models/SearchResult';
import { CalendarService } from '../calendar.service';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-search-dialog',
    imports: [
        UI_MODULES,
        MatTableModule,
        MatTooltipModule,
        DatePipe
    ],
    templateUrl: './search-dialog.component.html',
    styleUrl: './search-dialog.component.scss'
})
export class SearchDialogComponent {
    private readonly calendarService = inject(CalendarService);
    private readonly dialogData = inject(MAT_DIALOG_DATA) as string;
    private dialogRef = inject(MatDialogRef<SearchDialogComponent>);
    public dialog = inject(MatDialog);

    public readonly displayedColumns: string[] = ['eventTitle', 'eventNote', 'startDateTime', 'actions'];
    public dataSource: MatTableDataSource<SearchResult> = new MatTableDataSource<SearchResult>([]);

    ngOnInit() {
        if (this.dialogData) {
            this.fetchEvents();
        }
    }

    fetchEvents() {
        this.calendarService.searchEvents(this.dialogData).subscribe(events => {
            if (events) {
                const sortedEvents = events.sort((a, b) => 
                    new Date(a.startDateTime ?? '').getTime() - new Date(b.startDateTime ?? '').getTime()
                );
                this.dataSource.data = sortedEvents;
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
                            this.fetchEvents();
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
