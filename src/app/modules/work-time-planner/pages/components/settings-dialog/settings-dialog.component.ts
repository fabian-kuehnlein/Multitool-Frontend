import {
    Component,
    inject,
    OnInit,
    ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import { WorkTimePlannerService } from '../../../services/work-time-planner.service';
import { SettingsFormService } from './settings-form.service';

@Component({
    selector: 'app-settings-dialog',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, UI_MODULES],
    templateUrl: './settings-dialog.component.html',
    styleUrl: './settings-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
    providers: [SettingsFormService],
})
export class SettingsDialogComponent implements OnInit {
    private readonly dialogRef = inject(MatDialogRef<SettingsDialogComponent>);
    private readonly plannerService = inject(WorkTimePlannerService);
    protected readonly formService = inject(SettingsFormService);

    readonly form = this.formService.form;

    ngOnInit(): void {
        this.formService.patchFrom(this.plannerService.settings());
    }

    save(): void {
        const settings = this.formService.toSettings();
        if (!settings) return;
        this.plannerService.updateSettings(settings);
        this.dialogRef.close();
    }

    close(): void {
        this.dialogRef.close();
    }
}
