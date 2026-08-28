export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type Weekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';

export interface WeekdayOption {
    value: Weekday;
    label: string;
}

export const weekdayOptions: WeekdayOption[] = [
    { value: 'MO', label: 'Montag' },
    { value: 'TU', label: 'Dienstag' },
    { value: 'WE', label: 'Mittwoch' },
    { value: 'TH', label: 'Donnerstag' },
    { value: 'FR', label: 'Freitag' },
    { value: 'SA', label: 'Samstag' },
    { value: 'SU', label: 'Sonntag' },
];

export const frequencyLabels: Record<RecurrenceFrequency, string> = {
    DAILY: 'Tage',
    WEEKLY: 'Wochen',
    MONTHLY: 'Monate',
    YEARLY: 'Jahre',
};
