export interface SearchResult {
    eventId: string;
    eventTitle: string;
    eventNote: string;
    startDateTime: string | null;
    recurrenceRule: string | null;
    recurrenceEnd: string | null;
}
