import { CreateWorkDayDto, WorkDay } from '../models/work-time-planner.model';

export function toCreateWorkDayDto(day: WorkDay): CreateWorkDayDto {
    return {
        date: day.date,
        startTime: day.startTime,
        endTime: day.endTime,
        breakMinutes: day.breakMinutes,
        isHomeOffice: day.isHomeOffice,
        status: day.status,
        isLocked: day.isLocked,
    };
}
