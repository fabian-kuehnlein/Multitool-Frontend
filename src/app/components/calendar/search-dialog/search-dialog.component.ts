import { Component, inject } from '@angular/core';
import { UI_MODULES } from '../../../shared/material-ui';
import { MatTableModule } from '@angular/material/table';
import { SearchResult } from '../../../shared/models/SearchResult';
import { CalendarService } from '../../../shared/calendar.service';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-search-dialog',
    imports: [
        UI_MODULES,
        MatTableModule,
        MatTooltipModule
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
    public dataSource: SearchResult[] = [];

    ELEMENT_DATA: SearchResult[] = [
        {eventId: '1', eventTitle: 'Hydrogen', eventNote: '1.0079asdfasfdasfdasfafasfasfasdfasdfDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', startDateTime: '2025-07-01'},
        {eventId: '2', eventTitle: 'Helium', eventNote: '4.0026', startDateTime: 'He'},
        {eventId: '3', eventTitle: 'Lithium', eventNote: '6.941', startDateTime: 'Li'},
        {eventId: '4', eventTitle: 'Beryllium', eventNote: '9.0122', startDateTime: 'Be'},
        {eventId: '5', eventTitle: 'Boron', eventNote: '10.811', startDateTime: 'B'},
        {eventId: '6', eventTitle: 'Carbon', eventNote: '12.0107', startDateTime: 'C'},
        {eventId: '7', eventTitle: 'Nitrogen', eventNote: '14.0067', startDateTime: 'N'},
        {eventId: '8', eventTitle: 'Oxygen', eventNote: '15.9994', startDateTime: 'O'},
        {eventId: '9', eventTitle: 'Fluorine', eventNote: '18.9984', startDateTime: 'F'},
        {eventId: '10', eventTitle: 'Neon', eventNote: '20.1797', startDateTime: 'Ne'},
    ];

    ngOnInit() {
        if (this.dialogData) {
            this.fetchEvents();
        }
        this.dataSource = this.ELEMENT_DATA;
    }

    fetchEvents() {
        this.calendarService.searchEvents(this.dialogData).subscribe(events => {
            this.dataSource = events;
        });
    }

    goToDate(date: string) {
        console.log(date)
        if (date) {
            this.dialogRef.close({ data: date })
        } else {
            this.dialogRef.close(null);
        }
    }

    delete(deleteId: string) {
        console.log(deleteId)
        if (deleteId) {
            const dialogRef = this.dialog.open(ConfirmDialogComponent, {});

            dialogRef.afterClosed().subscribe(result => {
                if (result) {
                    this.calendarService.deleteEvent(result.data).subscribe({
                        next: () => {
                            this.fetchEvents();
                        },
						error: (error: any) => {
                            console.error('Error deleting event:', error);
						}
					});
                }
            })
        }
    }

    close() {
        this.dialogRef.close(null);
    }
}
