export interface GetICalLinkEvent {
    title: string;
    note: string | null;
    startDateTime: string | null;
    endDateTime?: string | null;
}
