import { Injectable, inject, signal, computed } from '@angular/core';
import { finalize } from 'rxjs';
import { Todo, CreateTodoDto, UpdateTodoDto } from '../models/todo.model';
import { TodoHttpService } from './todo-http.service';

@Injectable({
    providedIn: 'root',
})
export class TodoService {
    private readonly httpService = inject(TodoHttpService);

    // State Signals
    private readonly _todos = signal<Todo[]>([]);
    private readonly _loading = signal<boolean>(false);

    // Public Read-only Signals
    readonly todos = this._todos.asReadonly();
    readonly loading = this._loading.asReadonly();

    // Derived Signals
    readonly stats = computed(() => {
        const all = this._todos();
        return {
            total: all.length,
            active: all.filter((t) => !t.isDone).length,
            completed: all.filter((t) => t.isDone).length,
        };
    });

    loadTodos(): void {
        this._loading.set(true);
        this.httpService
            .getTodos()
            .pipe(finalize(() => this._loading.set(false)))
            .subscribe({
                next: (todos) => this._todos.set(todos),
                error: () => this._loading.set(false),
            });
    }

    addTodo(todoDto: CreateTodoDto): void {
        this._loading.set(true);
        this.httpService
            .createTodo(todoDto)
            .pipe(finalize(() => this._loading.set(false)))
            .subscribe({
                next: (newTodo) => {
                    this._todos.update((todos) => [...todos, newTodo]);
                },
            });
    }

    updateTodo(id: number, todoDto: UpdateTodoDto): void {
        this._loading.set(true);
        this.httpService
            .updateTodo(id, todoDto)
            .pipe(finalize(() => this._loading.set(false)))
            .subscribe({
                next: () => {
                    this._todos.update((todos) => {
                        const index = todos.findIndex((t) => t.id === id);
                        if (index !== -1) {
                            const newTodos = [...todos];
                            newTodos[index] = {
                                ...newTodos[index],
                                ...todoDto,
                            };
                            return newTodos;
                        }
                        return todos;
                    });
                },
            });
    }

    toggleDone(id: number, isDone: boolean): void {
        this.httpService.toggleDone(id).subscribe({
            next: () => {
                this._todos.update((todos) => {
                    const index = todos.findIndex((t) => t.id === id);
                    if (index !== -1) {
                        const newTodos = [...todos];
                        newTodos[index] = { ...newTodos[index], isDone };
                        return newTodos;
                    }
                    return todos;
                });
            },
        });
    }

    deleteTodo(id: number): void {
        this.httpService.deleteTodo(id).subscribe({
            next: () => {
                this._todos.update((todos) => todos.filter((t) => t.id !== id));
            },
        });
    }
}
