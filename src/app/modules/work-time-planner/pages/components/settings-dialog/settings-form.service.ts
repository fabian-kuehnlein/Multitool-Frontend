import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WorkTimeSettings } from '../../../models/work-time-planner.model';

interface SettingsFormValues {
    dailyTargetHours: number;
    dailyTargetMinutes: number;
    breakRule6h: number;
    breakRule9h: number;
    homeOfficeLimit: number;
}

@Injectable()
export class SettingsFormService {
    private readonly fb = inject(FormBuilder);

    readonly form: FormGroup = this.fb.group({
        dailyTargetHours: [
            8,
            [Validators.required, Validators.min(1), Validators.max(12)],
        ],
        dailyTargetMinutes: [
            0,
            [Validators.required, Validators.min(0), Validators.max(59)],
        ],
        breakRule6h: [30, [Validators.required, Validators.min(0)]],
        breakRule9h: [45, [Validators.required, Validators.min(0)]],
        homeOfficeLimit: [6, [Validators.required, Validators.min(0)]],
    });

    patchFrom(settings: WorkTimeSettings): void {
        this.form.patchValue({
            dailyTargetHours: Math.floor(settings.dailyTargetMinutes / 60),
            dailyTargetMinutes: settings.dailyTargetMinutes % 60,
            breakRule6h: settings.breakRule6h,
            breakRule9h: settings.breakRule9h,
            homeOfficeLimit: settings.homeOfficeLimit,
        });
    }

    toSettings(): WorkTimeSettings | null {
        if (this.form.invalid) return null;
        const v = this.form.getRawValue() as SettingsFormValues;
        return {
            dailyTargetMinutes:
                v.dailyTargetHours * 60 + v.dailyTargetMinutes,
            breakRule6h: v.breakRule6h,
            breakRule9h: v.breakRule9h,
            homeOfficeLimit: v.homeOfficeLimit,
        };
    }
}
