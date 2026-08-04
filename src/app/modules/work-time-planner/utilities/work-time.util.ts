import dayjs from 'dayjs';

export function formatMinutes(minutes: number): string {
    const h = Math.floor(Math.abs(minutes) / 60);
    const m = Math.abs(minutes) % 60;
    const sign = minutes < 0 ? '-' : '';
    return `${sign}${h}h ${m.toString().padStart(2, '0')}min`;
}

export function getWeekRange(startDate: string): string {
    const start = dayjs(startDate);
    const end = start.add(4, 'day');
    return `${start.format('DD.MM.')} – ${end.format('DD.MM.YYYY')}`;
}

export function getWeekNumber(startDate: string): number {
    return dayjs(startDate).isoWeek();
}
