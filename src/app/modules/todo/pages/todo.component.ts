import {
    Component,
    inject,
    OnInit,
    OnDestroy,
    computed,
    signal,
    ChangeDetectionStrategy,
} from '@angular/core';
import dayjs from 'dayjs';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { UI_MODULES } from '../../../shared/utilities/material-ui';
import { TodoService } from '../services/todo.service';
import {
    Todo,
    CreateTodoDto,
    UpdateTodoDto,
    Priority,
} from '../models/todo.model';
import { TodoDialogComponent } from './components/todo-dialog/todo-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { SidenavComponent } from '../../../core/layout/sidenav/sidenav.component';
import { CategoryService } from '../../../shared/services/category.service';
import { MediaService } from '../../../core/services/media.service';
import { HotkeyService, Hotkeys } from '../../../core/services/hotkey.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-todo',
    standalone: true,
    imports: [CommonModule, UI_MODULES],
    templateUrl: './todo.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './todo.component.scss',
})
export class TodoComponent implements OnInit, OnDestroy {
    protected readonly todoService = inject(TodoService);
    protected readonly categoryService = inject(CategoryService);
    private readonly dialog = inject(MatDialog);
    private readonly snackbar = inject(SnackbarService);
    private readonly media = inject(MediaService);
    private readonly router = inject(Router);
    private readonly hotkeyService = inject(HotkeyService);
    private readonly hotkeyUnsubscribers: Array<() => void> = [];

    readonly sortBy = signal<'priority' | 'dueDate' | 'title'>('priority');
    readonly sortDirection = signal<'asc' | 'desc'>('asc');
    readonly filterStatus = signal<'all' | 'active' | 'completed'>('all');
    readonly filterPriority = signal<Priority | null>(null);

    readonly isMobile = this.media.isMobile;
    readonly isTablet = this.media.isTablet;

    readonly expandedTodoIds = signal<Set<string | number>>(new Set());
    readonly isCompletedExpanded = signal<boolean>(false);

    readonly filteredTodos = computed(() => {
        let list = this.todoService.todos();

        if (this.filterStatus() === 'active') {
            list = list.filter((t) => !t.isDone);
        } else if (this.filterStatus() === 'completed') {
            list = list.filter((t) => t.isDone);
        }

        if (this.filterPriority() !== null) {
            list = list.filter((t) => t.priority === this.filterPriority());
        }

        return this.sortTodos(list);
    });

    readonly activeTodos = computed(() => {
        return this.filteredTodos().filter((t) => !t.isDone);
    });

    readonly completedTodos = computed(() => {
        return this.filteredTodos().filter((t) => t.isDone);
    });

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

    openSideNav() {
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
                    (new Date(a.dueDate).getTime() -
                        new Date(b.dueDate).getTime()) *
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

    toggleExpand(todoId: string | number): void {
        const current = new Set(this.expandedTodoIds());
        if (current.has(todoId)) {
            current.delete(todoId);
        } else {
            current.add(todoId);
        }
        this.expandedTodoIds.set(current);
    }

    isExpanded(todoId: string | number): boolean {
        return this.expandedTodoIds().has(todoId);
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
                if (result.dueDate) {
                    result.dueDate = dayjs(result.dueDate).format(
                        'YYYY-MM-DDTHH:mm:ss',
                    );
                }
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
                if (result.dueDate) {
                    result.dueDate = dayjs(result.dueDate).format(
                        'YYYY-MM-DDTHH:mm:ss',
                    );
                }
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

    changeSort(criterion: 'priority' | 'dueDate' | 'title'): void {
        if (this.sortBy() === criterion) {
            this.sortDirection.set(
                this.sortDirection() === 'asc' ? 'desc' : 'asc',
            );
        } else {
            this.sortBy.set(criterion);
            this.sortDirection.set('desc');
        }
    }

    getPriorityColor(priority: Priority): string {
        switch (priority) {
            case Priority.High:
                return '#f44336';
            case Priority.Medium:
                return '#ff9800';
            case Priority.Low:
                return '#4caf50';
            default:
                return '#9e9e9e';
        }
    }

    getPriorityLabel(priority: Priority): string {
        switch (priority) {
            case Priority.High:
                return 'Hoch';
            case Priority.Medium:
                return 'Mittel';
            case Priority.Low:
                return 'Niedrig';
            default:
                return 'Normal';
        }
    }

    setFilterStatus(status: 'all' | 'active' | 'completed') {
        this.filterStatus.set(status);
        if (status === 'completed') {
            this.isCompletedExpanded.set(true);
        }
    }

    toggleCompletedCollapse() {
        this.isCompletedExpanded.set(!this.isCompletedExpanded());
    }

    setFilterPriority(priority: Priority | null) {
        this.filterPriority.set(priority);
    }

    getCategory(categoryId: string | number) {
        const id = categoryId.toString();
        return this.categoryService
            .categories()
            .find((c) => c.id.toString() === id);
    }
}
