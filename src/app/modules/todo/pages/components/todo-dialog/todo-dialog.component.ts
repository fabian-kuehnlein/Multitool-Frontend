import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import { Todo, Priority } from '../../../models/todo.model';
import { CategoryService } from '../../../../../shared/services/category.service';

@Component({
  selector: 'app-todo-dialog',
  standalone: true,
  imports: [CommonModule, UI_MODULES],
  templateUrl: './todo-dialog.component.html',
  styleUrl: './todo-dialog.component.scss',
})
export class TodoDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<TodoDialogComponent>);
  private readonly data = inject<{ todo?: Todo }>(MAT_DIALOG_DATA);
  protected readonly categoryService = inject(CategoryService);

  todoForm: FormGroup;
  isEditMode: boolean;

  priorities = [
    { value: Priority.Low, label: 'Niedrig', color: '#4caf50' },
    { value: Priority.Medium, label: 'Mittel', color: '#ff9800' },
    { value: Priority.High, label: 'Hoch', color: '#f44336' },
  ];

  constructor() {
    this.isEditMode = !!this.data?.todo;
    this.todoForm = this.fb.group({
      title: [this.data?.todo?.title || '', [Validators.required]],
      description: [this.data?.todo?.description || ''],
      priority: [this.data?.todo?.priority || Priority.Medium, [Validators.required]],
      dueDate: [this.data?.todo?.dueDate || null],
      categoryId: [this.data?.todo?.categoryId || '', [Validators.required]],
    });
  }


  onSubmit(): void {
    if (this.todoForm.valid) {
      this.dialogRef.close(this.todoForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
