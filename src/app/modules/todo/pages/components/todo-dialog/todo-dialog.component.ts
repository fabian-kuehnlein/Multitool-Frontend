import {
    Component,
    inject,
    computed,
    signal,
    effect,
    ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
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
    readonly isDone = signal(this.data?.todo?.isDone ?? false);
    protected readonly priorities = PRIORITY_OPTIONS;
    protected readonly categories = this.categoryService.categories;

    protected readonly selectableCategories = this.categoryService.selectableCategoriesForModule(
        AppModule.TODO,
        () => this.form.controls.categoryId.value,
    );
    private readonly defaultCategory = this.categoryService.defaultCategoryForModule(AppModule.TODO);

    private readonly formValue = toSignal(this.form.valueChanges, {
        initialValue: this.form.getRawValue(),
    });

    protected readonly selectedCategory = computed(() => {
        const id = this.formValue()?.categoryId ?? this.form.controls.categoryId.value;
        return (
            this.selectableCategories().find((c) => c.id === id) ??
            this.categories().find((c) => c.id === id) ??
            null
        );
    });

    protected readonly selectedPriority = computed(() => {
        const p = this.formValue()?.priority ?? this.form.controls.priority.value;
        return this.priorities.find((o) => o.value === p) ?? null;
    });

    constructor() {
        if (this.isEditMode() && this.data?.todo) {
            this.formService.patchFrom(this.data.todo);
        }

        // Preselect default category for new todos once categories have loaded.
        effect(() => {
            if (this.isEditMode()) return;
            if (this.form.controls.categoryId.value != null) return;
            const defaultCat = this.defaultCategory();
            if (defaultCat) {
                this.form.controls.categoryId.setValue(defaultCat.id);
            }
        });
    }

    onSubmit(): void {
        if (this.form.invalid) return;

        if (this.isEditMode()) {
            const isDoneChanged =
                this.data?.todo != null &&
                this.isDone() !== this.data.todo.isDone;
            this.dialogRef.close({
                updateData: this.formService.getUpdateData(),
                isDone: this.isDone(),
                isDoneChanged,
            });
        } else {
            this.dialogRef.close(this.formService.getCreateData());
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
