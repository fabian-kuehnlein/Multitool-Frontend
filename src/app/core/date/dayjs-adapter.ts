import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats } from '@angular/material/core';
import { Inject, Injectable, Optional, Provider } from '@angular/core';
import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localeData from 'dayjs/plugin/localeData';
import utc from 'dayjs/plugin/utc';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(customParseFormat);
dayjs.extend(localeData);
dayjs.extend(utc);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(isoWeek);

export const DAYJS_DATE_FORMATS: MatDateFormats = {
    parse: {
        dateInput: ['DD.MM.YYYY', 'D.M.YYYY'],
        timeInput: 'HH:mm',
    },
    display: {
        dateInput: 'DD.MM.YYYY',
        monthYearLabel: 'MMM YYYY',
        dateA11yLabel: 'DD.MM.YYYY',
        monthYearA11yLabel: 'MMMM YYYY',
        timeInput: 'HH:mm',
        timeOptionLabel: 'HH:mm',
    },
};

@Injectable()
export class DayjsAdapter extends DateAdapter<Dayjs> {
    private _localeData!: ReturnType<typeof dayjs.localeData>;

    constructor(@Optional() @Inject(MAT_DATE_LOCALE) locale: string) {
        super();
        this.setLocale(locale || 'de');
    }

    override setLocale(locale: string): void {
        super.setLocale(locale);
        dayjs.locale(locale);
        this._localeData = dayjs.localeData();
    }

    override getYear(date: Dayjs): number {
        return date.year();
    }

    override getMonth(date: Dayjs): number {
        return date.month();
    }

    override getDate(date: Dayjs): number {
        return date.date();
    }

    override getDayOfWeek(date: Dayjs): number {
        return date.day();
    }

    override getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
        const months = [];
        for (let i = 0; i < 12; i++) {
            months.push(dayjs().month(i).format(
                style === 'long' ? 'MMMM' : style === 'short' ? 'MMM' : 'MMM',
            ));
        }
        return months;
    }

    override getDateNames(): string[] {
        const names: string[] = [];
        for (let i = 1; i <= 31; i++) {
            names.push(String(i));
        }
        return names;
    }

    override getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
        const fn =
            style === 'long'
                ? 'weekdays'
                : style === 'short'
                  ? 'weekdaysShort'
                  : 'weekdaysMin';
        return this._localeData[fn]() as string[];
    }

    override getYearName(date: Dayjs): string {
        return date.format('YYYY');
    }

    override getFirstDayOfWeek(): number {
        return this._localeData.firstDayOfWeek();
    }

    override getNumDaysInMonth(date: Dayjs): number {
        return date.daysInMonth();
    }

    override clone(date: Dayjs): Dayjs {
        return date.clone();
    }

    override createDate(year: number, month: number, date: number): Dayjs {
        return dayjs(new Date(year, month, date));
    }

    override today(): Dayjs {
        return dayjs();
    }

    override parse(value: any, parseFormat: any): Dayjs | null {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        if (value instanceof dayjs.constructor) {
            return value as Dayjs;
        }

        if (value instanceof Date) {
            return dayjs(value);
        }

        if (typeof value === 'number') {
            return dayjs(value);
        }

        if (typeof value === 'string') {
            const formats = Array.isArray(parseFormat)
                ? parseFormat
                : parseFormat
                  ? [parseFormat]
                  : ['DD.MM.YYYY', 'YYYY-MM-DD', 'HH:mm'];

            for (const fmt of formats) {
                const parsed = dayjs(value, fmt, this.locale || 'de', true);
                if (parsed.isValid()) {
                    return parsed;
                }
            }

            const fallback = dayjs(value);
            return fallback.isValid() ? fallback : null;
        }

        return null;
    }

    override format(date: Dayjs, displayFormat: any): string {
        if (!date || !date.isValid()) {
            return '';
        }
        return date.format(displayFormat);
    }

    override addCalendarYears(date: Dayjs, years: number): Dayjs {
        return date.add(years, 'year');
    }

    override addCalendarMonths(date: Dayjs, months: number): Dayjs {
        return date.add(months, 'month');
    }

    override addCalendarDays(date: Dayjs, days: number): Dayjs {
        return date.add(days, 'day');
    }

    override toIso8601(date: Dayjs): string {
        return date.format('YYYY-MM-DDTHH:mm:ss');
    }
    override isDateInstance(obj: any): boolean {
        return dayjs.isDayjs(obj);
    }

    override isValid(date: Dayjs): boolean {
        return date ? date.isValid() : false;
    }

    override invalid(): Dayjs {
        return dayjs('invalid');
    }

    override setTime(target: Dayjs, hours: number, minutes: number, seconds: number): Dayjs {
        return target.hour(hours).minute(minutes).second(seconds);
    }

    override getHours(date: Dayjs): number {
        return date.hour();
    }

    override getMinutes(date: Dayjs): number {
        return date.minute();
    }

    override getSeconds(date: Dayjs): number {
        return date.second();
    }

    override parseTime(value: any, parseFormat: any): Dayjs | null {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        if (value instanceof dayjs.constructor) {
            return value as Dayjs;
        }

        if (value instanceof Date) {
            return dayjs(value);
        }

        if (typeof value === 'string') {
            const formats = Array.isArray(parseFormat)
                ? parseFormat
                : parseFormat
                  ? [parseFormat]
                  : ['HH:mm', 'HH:mm:ss'];

            for (const fmt of formats) {
                const parsed = dayjs(value, fmt, this.locale || 'de', true);
                if (parsed.isValid()) {
                    return parsed;
                }
            }
            return null;
        }

        return null;
    }

    override addSeconds(date: Dayjs, amount: number): Dayjs {
        return date.add(amount, 'second');
    }

    override deserialize(value: any): Dayjs | null {
        if (value === null || value === undefined) {
            return null;
        }

        if (value instanceof dayjs.constructor) {
            return value as Dayjs;
        }

        if (value instanceof Date) {
            return dayjs(value);
        }

        if (typeof value === 'string') {
            return dayjs(value);
        }

        if (typeof value === 'number') {
            return dayjs(value);
        }

        return null;
    }
}

export function provideDayjsAdapter(formats?: MatDateFormats): Provider[] {
    return [
        { provide: DateAdapter, useClass: DayjsAdapter },
        { provide: MAT_DATE_FORMATS, useValue: formats || DAYJS_DATE_FORMATS },
    ];
}
