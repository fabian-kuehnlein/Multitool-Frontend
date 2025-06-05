export interface CreateCalendarEvent {
  eventTitle: string;
  eventNote: string;
  startDateTime: string | null;
  endDateTime?: string | null;
  isAllDay: boolean;
  categoryId?: string;
  recurrenceRule?: string | null;
  recurrenceEnd?: string | null;
}
