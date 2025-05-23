import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatIconModule } from '@angular/material/icon';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-event-dialog',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatButtonModule,
    MatDatepickerModule,
    MatInputModule,
    MatSelectModule,
    MatTimepickerModule,
    MatIconModule,
    MatDividerModule,
    ReactiveFormsModule,
    MatSlideToggleModule
  ],
  providers: [provideMomentDateAdapter()],
  templateUrl: './event-dialog.component.html',
  styleUrl: './event-dialog.component.scss'
})
export class EventDialogComponent {
    private fb = inject(FormBuilder);
    private dialogRef = inject(MatDialogRef<EventDialogComponent>);

    protected readonly values = signal<Record<string, string>>({
        eventTitle: '',
        eventNote: ''
    });

    protected onInput(key: string, event: Event) {
        const input = (event.target as HTMLInputElement).value;
        this.values.update(current => ({
            ...current,
            [key]: input
        }));
    }

    eventForm: FormGroup = this.fb.group({
        eventTitle: ['', [Validators.required, Validators.maxLength(100)]],
        eventNote: ['', [Validators.maxLength(200)]],
        startDate: [null, [Validators.required]],
        startTime: [null, [Validators.required]],
        endDate: [null],
        endTime: [null],
        isAllDay: [false],
        categoryId: ['', [Validators.required]]
    });
    
    ngOnInit() {
        this.eventForm.get('isAllDay')?.valueChanges.subscribe((isAllDay: boolean) => {
            if (isAllDay) {
                this.eventForm.get('startTime')!.disable();
                this.eventForm.get('endTime')!.disable();
            } else {
                this.eventForm.get('startTime')!.enable();
                this.eventForm.get('endTime')!.enable();
            }
        })
    }

    save() {
        if (this.eventForm.valid) {
            this.dialogRef.close(this.eventForm.value);
        }
    }

    close() {
        this.dialogRef.close(null);
    }
}
