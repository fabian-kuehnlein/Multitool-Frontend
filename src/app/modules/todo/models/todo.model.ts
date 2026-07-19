export enum Priority {
    Low = 1,
    Medium = 2,
    High = 3,
}

export interface Todo {
    id: string;
    title: string;
    description?: string | null;
    categoryId: string;
    isDone: boolean;
    priority: Priority;
    dueDate?: string | null;
    creationDateTime: string;
}

export interface CreateTodoDto {
    title: string;
    description?: string | null;
    categoryId: string;
    priority: Priority;
    dueDate?: string | null;
}

export interface UpdateTodoDto extends CreateTodoDto {
    isDone: boolean;
}
