import { Component, signal, ViewChild } from '@angular/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'

import { CalendarOptions, DateSelectArg, EventApi } from '@fullcalendar/core';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import deLocale from '@fullcalendar/core/locales/de-at';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';



@Component({
	selector: 'app-calendar',
	imports: [
		MatDatepickerModule,
		MatCardModule,
		MatButtonModule,
		FullCalendarModule,
		MatIconModule
	],
	templateUrl: './calendar.component.html',
	styleUrl: './calendar.component.scss'
})

export class CalendarComponent {
	@ViewChild('calendarRef') calendarComponent!: FullCalendarComponent

	get calenderApi() {
		return this.calendarComponent.getApi();
	}

	calendarOptions: CalendarOptions = {
		plugins: [
			dayGridPlugin,
			timeGridPlugin,
			interactionPlugin
		],
		locales: [deLocale],
		headerToolbar: {
			left: 'title',
			center: '',
			right: 'dayGridMonth timeGridWeek timeGridDay prev next today'
		},
		// headerToolbar: false,
		initialView: 'dayGridMonth',
		weekends: true,
		editable: true,
		selectable: true,
		selectMirror: true,
		dayMaxEvents: true,
		contentHeight: 800,
		showNonCurrentDates: false,
		fixedWeekCount: false
	};
	currentEvents = signal<EventApi[]>([]);

	goToday() {
		this.calenderApi.today();
	}
}
