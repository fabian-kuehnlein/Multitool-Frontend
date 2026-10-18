export interface WorktimeSettingsDto {
    dailyTargetMinutes: number;
    homeOfficeLimitMonthly: number;
    homeOfficeLimitWeekly: number;
}

export interface SettingsDto {
    worktime: WorktimeSettingsDto;
}

export interface UpdateSettingDto {
    value: string;
}

export const SETTINGS_MODULE_WORKTIME = 'worktime';

export const WORKTIME_SETTING_KEYS = {
    DAILY_TARGET_MINUTES: 'daily_target_minutes',
    HOME_OFFICE_LIMIT_MONTHLY: 'home_office_limit_monthly',
    HOME_OFFICE_LIMIT_WEEKLY: 'home_office_limit_weekly',
} as const;
