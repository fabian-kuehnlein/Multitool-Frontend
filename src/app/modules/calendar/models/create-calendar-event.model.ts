export interface CreateCalendarEvent {
  title: string;
  note: string;
  startDateTime: string | null;
  endDateTime?: string | null;
  isAllDay: boolean;
  categoryId?: string;
  recurrenceRule?: string | null;
  recurrenceEnd?: string | null;
}
