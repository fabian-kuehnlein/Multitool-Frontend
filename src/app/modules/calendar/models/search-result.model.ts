export interface SearchResult {
    eventId: number;
    eventTitle: string;
    eventNote: string | null;
    startDateTime: string | null;
    recurrenceRule: string | null;
    recurrenceEnd: string | null;
}

export interface SearchResultRow extends SearchResult {
    displayDate: string | null;
    isNextOccurrence: boolean;
}
