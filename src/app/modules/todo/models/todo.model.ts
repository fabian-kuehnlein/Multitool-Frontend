export enum Priority {
    LOW = 1,
    MEDIUM = 2,
    HIGH = 3,
}

export interface Todo {
    id: number;
    title: string;
    description?: string | null;
    categoryId: number;
    isDone: boolean;
    priority: Priority;
    dueDate?: string | null;
    creationDateTime: string;
    completedDateTime?: string | null;
}

export interface CreateTodoDto {
    title: string;
    description?: string | null;
    categoryId: number;
    priority: Priority;
    dueDate?: string | null;
}

export type UpdateTodoDto = CreateTodoDto;
