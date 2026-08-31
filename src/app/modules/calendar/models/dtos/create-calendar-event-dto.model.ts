export interface CreateCalendarEventDto {
    title: string;
    note: string | null;
    startDateTime: string | null;
    endDateTime?: string | null;
    isAllDay: boolean;
    categoryId: number;
    recurrenceRule?: string | null;
    recurrenceEnd?: string | null;
}
