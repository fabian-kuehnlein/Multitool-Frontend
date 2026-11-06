import { DateUtil } from '../../../shared/utilities/date.util';
import {
    UpsertWorkDayDto,
    WorkDay,
} from '../models/work-time-planner.model';

export function toUpsertWorkDayDto(day: WorkDay): UpsertWorkDayDto {
    return {
        date: DateUtil.formatApiDateTime(day.date) ?? day.date,
        startTime: day.startTime,
        endTime: day.endTime,
        breakMinutes: day.breakMinutes,
        isHomeOffice: day.isHomeOffice,
        status: day.status,
    };
}
