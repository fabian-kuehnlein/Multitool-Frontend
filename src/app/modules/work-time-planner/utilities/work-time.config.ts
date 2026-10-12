import { WorkTimeSettings } from '../models/work-time-planner.model';

export const DEFAULT_WORK_TIME_SETTINGS: WorkTimeSettings = {
    dailyTargetMinutes: 480,
    breakRule6h: 30,
    breakRule9h: 45,
    homeOfficeLimit: 6,
};

export const WEEKDAY_NAMES = [
    'Montag',
    'Dienstag',
    'Mittwoch',
    'Donnerstag',
    'Freitag',
] as const;

export const SIX_HOURS_BREAK_MINUTES = 360;
export const NINE_HOURS_BREAK_MINUTES = 540;
export const TEN_HOURS_BREAK_MINUTES = 600;

export const DAY_INPUT_DEBOUNCE_MS = 500;
