import { Injectable, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import dayjs from 'dayjs';
import {
    CreateTodoDto,
    Priority,
    Todo,
    UpdateTodoDto,
} from '../../../models/todo.model';

@Injectable()
export class TodoDialogFormService {
    private readonly fb = inject(FormBuilder);

    readonly form = this.fb.nonNullable.group({
        title: ['', [Validators.required]],
        description: [''],
        priority: [Priority.Medium, [Validators.required]],
        dueDate: this.fb.control<string | null>(null),
        categoryId: this.fb.control<number | null>(
            null,
            [Validators.required],
        ),
    });

    patchFrom(todo: Todo): void {
        this.form.patchValue({
            title: todo.title,
            description: todo.description ?? '',
            priority: todo.priority,
            dueDate: todo.dueDate ?? null,
            categoryId: todo.categoryId,
        });
    }

    getCreateData(): CreateTodoDto {
        const value = this.form.getRawValue();
        return {
            title: value.title,
            description:
                value.description?.trim() === '' ? null : value.description,
            categoryId: value.categoryId!,
            priority: value.priority,
            dueDate: value.dueDate
                ? dayjs(value.dueDate).format('YYYY-MM-DDTHH:mm:ss')
                : null,
        };
    }

    getUpdateData(): UpdateTodoDto {
        return this.getCreateData();
    }
}
