export interface CalendarEvent {
  eventId: string;
  eventTitle: string;
  eventNote: string;
  startDateTime: string | null;
  endDateTime?: string | null;
  isAllDay?: boolean;
  categoryId?: string;
}
