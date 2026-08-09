export interface CalendarEvent {
    id: string;
    title: string;
    note: string | null;
    startDateTime: string | null;
    endDateTime?: string | null;
    isAllDay?: boolean;
    categoryId?: string | number | null;
    recurrenceRule?: string | null;
    recurrenceEnd?: string | null;
    isTodo?: boolean;
}
