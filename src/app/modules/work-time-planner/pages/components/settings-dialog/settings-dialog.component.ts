import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import { WorkTimePlannerService } from '../../../services/work-time-planner.service';

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UI_MODULES],
  templateUrl: './settings-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './settings-dialog.component.scss',
})
export class SettingsDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<SettingsDialogComponent>);
  private readonly plannerService = inject(WorkTimePlannerService);

  readonly form: FormGroup = this.fb.group({
    dailyTargetHours: [8, [Validators.required, Validators.min(1), Validators.max(12)]],
    dailyTargetMinutes: [0, [Validators.required, Validators.min(0), Validators.max(59)]],
    breakRule6h: [30, [Validators.required, Validators.min(0)]],
    breakRule9h: [45, [Validators.required, Validators.min(0)]],
    homeOfficeLimit: [6, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    const s = this.plannerService.settings();
    this.form.patchValue({
      dailyTargetHours: Math.floor(s.dailyTargetMinutes / 60),
      dailyTargetMinutes: s.dailyTargetMinutes % 60,
      breakRule6h: s.breakRule6h,
      breakRule9h: s.breakRule9h,
      homeOfficeLimit: s.homeOfficeLimit,
    });
  }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    this.plannerService.updateSettings({
      dailyTargetMinutes: (v.dailyTargetHours * 60) + v.dailyTargetMinutes,
      breakRule6h: v.breakRule6h,
      breakRule9h: v.breakRule9h,
      homeOfficeLimit: v.homeOfficeLimit,
    });
    this.dialogRef.close();
  }

  close(): void {
    this.dialogRef.close();
  }
}
