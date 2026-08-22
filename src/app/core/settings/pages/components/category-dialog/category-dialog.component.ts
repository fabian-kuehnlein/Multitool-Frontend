import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Category, CreateCategoryDto } from '../../../../../shared/models/category.model';
import { CategoryService } from '../../../../../shared/services/category.service';
import { getDistinctPresetColors } from '../../../logic/color.logic';

export interface CategoryDialogData {
    category?: Category;
}

@Component({
    selector: 'app-category-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
    ],
    templateUrl: './category-dialog.component.html',
    styleUrl: './category-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class CategoryDialogComponent {
    private readonly fb = inject(FormBuilder);
    private readonly dialogRef = inject(MatDialogRef<CategoryDialogComponent>);
    private readonly categoryService = inject(CategoryService);
    public readonly data = inject<CategoryDialogData>(MAT_DIALOG_DATA);

    readonly presetColors: string[] = getDistinctPresetColors(
        this.categoryService.categories().map((category) => category.color),
        this.data?.category?.color,
    );

    readonly form = this.fb.group({
        name: [this.data?.category?.name ?? '', [Validators.required, Validators.maxLength(50)]],
        color: [this.data?.category?.color ?? '#3b82f6', [Validators.required]],
    });

    get isEditMode(): boolean {
        return !!this.data?.category;
    }

    selectPresetColor(color: string): void {
        this.form.patchValue({ color });
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const value = this.form.getRawValue();
        const dto: CreateCategoryDto = {
            name: value.name!.trim(),
            color: value.color!,
        };

        this.dialogRef.close(dto);
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
