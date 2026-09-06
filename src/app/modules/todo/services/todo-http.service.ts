import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Todo, CreateTodoDto, UpdateTodoDto } from '../models/todo.model';

@Injectable({
    providedIn: 'root',
})
export class TodoHttpService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.MultitoolApi}/api/Todo`;

    getTodos(): Observable<Todo[]> {
        return this.http.get<Todo[]>(this.apiUrl);
    }

    createTodo(todo: CreateTodoDto): Observable<number> {
        return this.http.post<number>(this.apiUrl, todo);
    }

    updateTodo(id: number, todo: UpdateTodoDto): Observable<Todo> {
        return this.http.put<Todo>(`${this.apiUrl}/${id}`, todo);
    }

    setDone(id: number, isDone: boolean): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${id}/done`, isDone);
    }

    deleteTodo(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
