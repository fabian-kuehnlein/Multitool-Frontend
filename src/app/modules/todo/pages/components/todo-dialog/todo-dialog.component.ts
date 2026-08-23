import { Component, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import { Todo } from '../../../models/todo.model';
import { CategoryService } from '../../../../../shared/services/category.service';
import { AppModule } from '../../../../../shared/models/app-module.enum';
import { PRIORITY_OPTIONS } from '../../../utilities/todo.config';
import { TodoDialogFormService } from './todo-dialog-form.service';

@Component({
    selector: 'app-todo-dialog',
    standalone: true,
    imports: [CommonModule, UI_MODULES],
    providers: [TodoDialogFormService],
    templateUrl: './todo-dialog.component.html',
    styleUrl: './todo-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class TodoDialogComponent {
    private readonly dialogRef = inject(MatDialogRef<TodoDialogComponent>);
    private readonly data = inject<{ todo?: Todo }>(MAT_DIALOG_DATA);
    protected readonly formService = inject(TodoDialogFormService);
    protected readonly categoryService = inject(CategoryService);

    readonly form = this.formService.form;
    readonly isEditMode = signal(!!this.data?.todo);
    protected readonly priorities = PRIORITY_OPTIONS;

    protected readonly selectableCategories = this.categoryService.selectableCategoriesForModule(
        AppModule.Todo,
        () => this.form.controls.categoryId.value,
    );

    constructor() {
        if (this.isEditMode() && this.data?.todo) {
            this.formService.patchFrom(this.data.todo);
        }
    }

    onSubmit(): void {
        if (this.form.invalid) return;
        this.dialogRef.close(
            this.isEditMode()
                ? this.formService.getUpdateData()
                : this.formService.getCreateData(),
        );
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
