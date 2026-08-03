import { WorkTimeSettings } from '../models/work-time-planner.model';

export const DEFAULT_WORK_TIME_SETTINGS: WorkTimeSettings = {
    dailyTargetMinutes: 480,
    breakRule6h: 30,
    breakRule9h: 45,
    homeOfficeLimit: 6,
};
