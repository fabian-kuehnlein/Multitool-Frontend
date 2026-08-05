import {
    Component,
    inject,
    OnInit,
    OnDestroy,
    computed,
    signal,
    ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import dayjs from 'dayjs';
import { UI_MODULES } from '../../../shared/utilities/material-ui';
import { TodoService } from '../services/todo.service';
import {
    Todo,
    CreateTodoDto,
    UpdateTodoDto,
    Priority,
} from '../models/todo.model';
import {
    getPriorityColor,
    TodoFilterStatus,
    TodoSortBy,
    TodoSortDirection,
} from '../utilities/todo.config';
import { TodoDialogComponent } from './components/todo-dialog/todo-dialog.component';
import { TodoItemComponent } from './components/todo-item/todo-item.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CategoryService } from '../../../shared/services/category.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { SidenavComponent } from '../../../core/layout/sidenav/sidenav.component';
import { MediaService } from '../../../core/services/media.service';
import { HotkeyService, Hotkeys } from '../../../core/services/hotkey.service';

@Component({
    selector: 'app-todo',
    standalone: true,
    imports: [CommonModule, UI_MODULES, TodoItemComponent],
    templateUrl: './todo.component.html',
    styleUrl: './todo.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class TodoComponent implements OnInit, OnDestroy {
    protected readonly todoService = inject(TodoService);
    private readonly dialog = inject(MatDialog);
    private readonly snackbar = inject(SnackbarService);
    private readonly media = inject(MediaService);
    private readonly router = inject(Router);
    private readonly hotkeyService = inject(HotkeyService);
    private readonly categoryService = inject(CategoryService);
    private readonly hotkeyUnsubscribers: Array<() => void> = [];

    readonly Priority = Priority;
    protected readonly getPriorityColor = getPriorityColor;

    readonly sortBy = signal<TodoSortBy>('priority');
    readonly sortDirection = signal<TodoSortDirection>('asc');
    readonly filterStatus = signal<TodoFilterStatus>('all');
    readonly filterPriority = signal<Priority | null>(null);
    readonly filterCategory = signal<string | null>(null);

    readonly isMobile = this.media.isMobile;
    readonly isTablet = this.media.isTablet;

    readonly isCompletedExpanded = signal(false);

    readonly todoCategories = computed(() => {
        const usedIds = new Set(
            this.todoService.todos().map((todo) => todo.categoryId),
        );
        return this.categoryService
            .categories()
            .filter((category) => usedIds.has(category.id));
    });

    readonly filteredTodos = computed(() => {
        let list = this.todoService.todos();

        if (this.filterStatus() === 'active') {
            list = list.filter((todo) => !todo.isDone);
        } else if (this.filterStatus() === 'completed') {
            list = list.filter((todo) => todo.isDone);
        }

        if (this.filterPriority() !== null) {
            list = list.filter((todo) => todo.priority === this.filterPriority());
        }

        if (this.filterCategory() !== null) {
            list = list.filter((todo) => todo.categoryId === this.filterCategory());
        }

        return this.sortTodos(list);
    });

    readonly activeTodos = computed(() =>
        this.filteredTodos().filter((todo) => !todo.isDone),
    );

    readonly completedTodos = computed(() =>
        this.filteredTodos().filter((todo) => todo.isDone),
    );

    ngOnInit(): void {
        this.todoService.loadTodos();
        this.hotkeyUnsubscribers.push(
            this.hotkeyService.register({
                id: 'todo.create',
                combo: Hotkeys.create,
                description: 'Neue Aufgabe erstellen',
                action: () => this.onAddTodo(),
            }),
        );
    }

    ngOnDestroy(): void {
        this.hotkeyUnsubscribers.forEach((unsubscribe) => unsubscribe());
    }

    openSideNav(): void {
        this.dialog.open(SidenavComponent, {
            position: this.media.isMobile()
                ? { bottom: '120px' }
                : { top: '90px', left: '30px' },
            width: this.media.isMobile() ? '90vw' : 'auto',
            height: 'auto',
            hasBackdrop: true,
            backdropClass: 'transparent-backdrop',
            data: 'todo',
        });
    }

    private sortTodos(todos: Todo[]): Todo[] {
        const direction = this.sortDirection() === 'asc' ? 1 : -1;
        const criterion = this.sortBy();

        return [...todos].sort((a, b) => {
            if (criterion === 'priority') {
                return (a.priority - b.priority) * direction * -1;
            }
            if (criterion === 'dueDate') {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return (
                    (dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf()) *
                    direction
                );
            }
            return a.title.localeCompare(b.title) * direction;
        });
    }

    onToggleDone(todo: Todo): void {
        this.todoService.toggleDone(todo.id, !todo.isDone);
        this.snackbar.openSuccess('Status aktualisiert');
    }

    onAddTodo(): void {
        const dialogRef = this.dialog.open(TodoDialogComponent, {
            width: this.media.isMobile() ? '100vw' : '500px',
            height: this.media.isMobile() ? '100vh' : 'auto',
            minWidth: this.media.isMobile() ? '100vw' : 'unset',
            maxWidth: this.media.isMobile() ? '100vw' : '95vw',
            panelClass: this.media.isMobile() ? 'full-screen-dialog' : '',
        });

        dialogRef.afterClosed().subscribe((result: CreateTodoDto) => {
            if (result) {
                this.todoService.addTodo(result);
                this.snackbar.openSuccess('Aufgabe hinzugefügt');
            }
        });
    }

    goToDateInCalendar(dueDate: string): void {
        this.router.navigate(['/calendar'], { queryParams: { date: dueDate } });
    }

    onEditTodo(todo: Todo): void {
        const dialogRef = this.dialog.open(TodoDialogComponent, {
            width: this.media.isMobile() ? '100vw' : '500px',
            height: this.media.isMobile() ? '100vh' : 'auto',
            minWidth: this.media.isMobile() ? '100vw' : 'unset',
            maxWidth: this.media.isMobile() ? '100vw' : '95vw',
            panelClass: this.media.isMobile() ? 'full-screen-dialog' : '',
            data: { todo },
        });

        dialogRef.afterClosed().subscribe((result: UpdateTodoDto) => {
            if (result) {
                this.todoService.updateTodo(todo.id, result);
                this.snackbar.openSuccess('Aufgabe aktualisiert');
            }
        });
    }

    onDeleteTodo(todo: Todo): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Löschen',
                message: `Möchtest du "${todo.title}" wirklich löschen?`,
            },
        });

        dialogRef.afterClosed().subscribe((confirm) => {
            if (confirm) {
                this.todoService.deleteTodo(todo.id);
                this.snackbar.openSuccess('Aufgabe gelöscht');
            }
        });
    }

    changeSort(criterion: TodoSortBy): void {
        if (this.sortBy() === criterion) {
            this.sortDirection.update((direction) =>
                direction === 'asc' ? 'desc' : 'asc',
            );
        } else {
            this.sortBy.set(criterion);
            this.sortDirection.set('desc');
        }
    }

    setFilterStatus(status: TodoFilterStatus): void {
        this.filterStatus.set(status);
        if (status === 'completed') {
            this.isCompletedExpanded.set(true);
        }
    }

    toggleCompletedCollapse(): void {
        this.isCompletedExpanded.update((value) => !value);
    }

    setFilterPriority(priority: Priority | null): void {
        this.filterPriority.set(priority);
    }

    setFilterCategory(categoryId: string | null): void {
        this.filterCategory.set(categoryId);
    }
}
