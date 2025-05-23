export interface CalendarEvent {
  eventId: string;
  eventTitle: string;
  eventNote: string;
  startDateTime: Date | string;
  endDateTime?: Date | string;
  isAllDay?: boolean;
  categoryId?: string;
}
