export enum DayStatus {
    NORMAL = 'normal',
    HOLIDAY = 'holiday',
    VACATION = 'vacation',
    SICK = 'sick',
}

export interface WorkDay {
    id: number;
    date: string;
    startTime: string | null;
    endTime: string | null;
    breakMinutes: number;
    workMinutes: number;
    overtimeMinutes: number;
    isHomeOffice: boolean;
    status: DayStatus;
    isLocked: boolean;
    warnings: WorkDayWarning[];
}

export interface WorkDayWarning {
    type: 'PauseTooShort' | 'Over10Hours' | 'Under6Hours';
    message: string;
}

export interface WeekSummary {
    year: number;
    weekNumber: number;
    totalOvertime: number;
}

export interface WorkTimeSettings {
    dailyTargetMinutes: number;
    breakRule6h: number;
    breakRule9h: number;
    homeOfficeLimit: number;
}

export interface CreateWorkDayDto {
    date: string;
    startTime: string | null;
    endTime: string | null;
    breakMinutes: number;
    isHomeOffice: boolean;
    status: DayStatus;
}

export interface UpdateWorkDayDto extends CreateWorkDayDto {
    isLocked: boolean;
}

export interface MonthHoCount {
    year: number;
    month: number;
    monthName: string;
    count: number;
}
