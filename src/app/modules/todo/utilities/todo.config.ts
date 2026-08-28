import { Priority } from '../models/todo.model';

export type TodoSortBy = 'priority' | 'dueDate' | 'title';
export type TodoSortDirection = 'asc' | 'desc';
export type TodoFilterStatus = 'all' | 'active' | 'completed';

export interface PriorityOption {
    value: Priority;
    label: string;
    color: string;
}

export const PRIORITY_OPTIONS: readonly PriorityOption[] = [
    { value: Priority.LOW, label: 'Niedrig', color: 'var(--priority-low)' },
    {
        value: Priority.MEDIUM,
        label: 'Mittel',
        color: 'var(--priority-medium)',
    },
    { value: Priority.HIGH, label: 'Hoch', color: 'var(--priority-high)' },
];

export function getPriorityLabel(priority: Priority): string {
    return (
        PRIORITY_OPTIONS.find((option) => option.value === priority)?.label ??
        'Normal'
    );
}

export function getPriorityColor(priority: Priority): string {
    return (
        PRIORITY_OPTIONS.find((option) => option.value === priority)?.color ??
        'var(--text-muted)'
    );
}
