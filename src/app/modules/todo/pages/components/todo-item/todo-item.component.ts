import {
    Component,
    EventEmitter,
    inject,
    Input,
    Output,
    signal,
    ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import { Todo } from '../../../models/todo.model';
import { Category } from '../../../../../shared/models/category.model';
import { CategoryService } from '../../../../../shared/services/category.service';
import { getPriorityColor } from '../../../utilities/todo.config';

@Component({
    selector: 'app-todo-item',
    standalone: true,
    imports: [CommonModule, UI_MODULES],
    templateUrl: './todo-item.component.html',
    styleUrl: './todo-item.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class TodoItemComponent {
    protected readonly getPriorityColor = getPriorityColor;

    protected readonly descriptionSegments = (
        description: string,
    ): Array<{ text: string; isLink: boolean }> => {
        const urlPattern = /https?:\/\/[^\s]+/g;
        const segments: Array<{ text: string; isLink: boolean }> = [];
        let lastIndex = 0;

        for (const match of description.matchAll(urlPattern)) {
            const index = match.index ?? 0;
            if (index > lastIndex) {
                segments.push({
                    text: description.slice(lastIndex, index),
                    isLink: false,
                });
            }
            segments.push({ text: match[0], isLink: true });
            lastIndex = index + match[0].length;
        }

        if (lastIndex < description.length) {
            segments.push({
                text: description.slice(lastIndex),
                isLink: false,
            });
        }

        return segments;
    };

    @Input({ required: true }) todo!: Todo;
    @Input() mobile = false;

    @Output() toggleDone = new EventEmitter<Todo>();
    @Output() edit = new EventEmitter<Todo>();
    @Output() delete = new EventEmitter<Todo>();
    @Output() goToDate = new EventEmitter<string>();

    protected readonly expanded = signal(false);

    private readonly categoryService = inject(CategoryService);

    toggleExpand(): void {
        this.expanded.update((value) => !value);
    }

    onItemClick(): void {
        if (this.mobile) {
            this.toggleExpand();
        }
    }

    onCheckboxClick(event: Event): void {
        if (this.mobile) {
            event.stopPropagation();
        }
    }

    onToggleDone(): void {
        this.toggleDone.emit(this.todo);
    }

    onEdit(): void {
        this.edit.emit(this.todo);
    }

    onDelete(): void {
        this.delete.emit(this.todo);
    }

    onGoToDate(): void {
        if (this.todo.dueDate) {
            this.goToDate.emit(this.todo.dueDate);
        }
    }

    getCategory(categoryId: number): Category | undefined {
        return this.categoryService
            .categories()
            .find((category) => category.id === categoryId);
    }
}
