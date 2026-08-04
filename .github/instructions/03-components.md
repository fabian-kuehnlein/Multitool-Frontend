# Components

## Declaration

Every component is standalone and follows this shape:

```ts
import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UI_MODULES } from '../../../shared/utilities/material-ui';
import { TodoService } from '../services/todo.service';

@Component({
    selector: 'app-todo',
    standalone: true,
    imports: [CommonModule, UI_MODULES],
    templateUrl: './todo.component.html',
    styleUrl: './todo.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class TodoComponent {
    // ...
}
```

- Selector prefix is always `app-`.
- `imports` start with `CommonModule` and the shared `UI_MODULES`; add feature-specific modules (e.g. `FullCalendarModule`, `MatChipsModule`) explicitly after.
- Use external `templateUrl` + `styleUrl`; only inline templates for trivial one-liners.
- Set `changeDetection: ChangeDetectionStrategy.Eager` on every component.

## Injecting dependencies

- Use `inject()` for all dependencies, declared as fields near the top of the class:

```ts
protected readonly todoService = inject(TodoService);
private readonly dialog = inject(MatDialog);
private readonly snackbar = inject(SnackbarService);
```

- Members read by the template are `protected` (or `public` when needed); everything else is `private`. Add `readonly` where possible.

## Local state

- Use signals for any component state that renders: `readonly sortBy = signal<'priority' | 'dueDate' | 'title'>('priority')`.
- Derive display data with `computed()`; never mutate arrays in place — always create new references (`this.expandedTodoIds.set(new Set(...))`).
- Wire global state to the template by exposing service signals: `readonly isMobile = this.media.isMobile;`.

## Templates

- Use the **new built-in control flow** only: `@if`, `@else`, `@for (...; track ...)`, `@switch`. Do **not** use `*ngIf`, `*ngFor`, `ngSwitch`.
- Always provide a `track` expression in `@for`.
- Format the template with the component class as root structure; keep one logical block per `@if`/`@for` with consistent indentation (see `todo.component.html`).
- Call component methods in bindings where that keeps the template declarative (`getCategory(todo.categoryId)`), but prefer precomputed `computed()` signals for anything expensive or reused.
- Use `async` pipe or `toSignal()` for observables; do not manually subscribe in templates.

## Lifecycle

- Implement `OnInit` for kick-off work (e.g. `ngOnInit(): void { this.todoService.loadTodos(); }`).
- Use `ngOnDestroy` to clean up subscriptions — either via `takeUntil(destroy$)` with a `Subject<void>` or by relying on signals/`toSignal`.
- `viewChild()`/`viewChildren()` are the signal-based alternatives to `@ViewChild` — prefer them (see `calendar.component.ts`).
- `@HostListener` is fine for keyboard shortcuts, but consider `HotkeyService` (`core/services/hotkey.service.ts`) when the shortcut is app-wide.

## Dialogs

- Dialogs are standalone components under `<feature>/pages/components/<name>/` or `shared/components/<name>/`.
- Inject `MatDialogRef<DialogComponent>` and the typed data with `MAT_DIALOG_DATA` via `inject`:

```ts
private readonly dialogRef = inject(MatDialogRef<TodoDialogComponent>);
private readonly data = inject<{ todo?: Todo }>(MAT_DIALOG_DATA);
```

- On mobile, dialogs become full-screen: `width: '100vw'`, `height: '100vh'`, `minWidth/maxWidth: '100vw'`, `panelClass: 'full-screen-dialog'`. The `MediaService` drives this.
- **Form-heavy dialogs get a `<name>-form.service.ts`** co-located next to them (pattern: `event-dialog/event-form.service.ts`). It owns `buildForm()` + validators, patch/init for edit mode, and form-value → DTO mapping. The dialog component keeps only open/save/close orchestration and template-bound `computed` signals. Provide the service in the component's `providers` array.
- Use the shared `ConfirmDialogComponent` (`shared/components/confirm-dialog`) to open a confirm dialog anywhere in the app — e.g. before destructive actions — instead of rolling your own. Pass the text via `data` (`title`, `message`, `confirmText`, `cancelText`, `isDestructive`):

```ts
const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    data: {
        title: 'Löschen',
        message: `Möchtest du "${todo.title}" wirklich löschen?`,
    },
});
```

- Read the result via `dialogRef.afterClosed().subscribe((result) => ...)` and only act when a value is returned — `result` is `true` when the user confirmed. Full example: `modules/todo/pages/todo.component.ts`.
- The sidenav is opened as a dialog (`SidenavComponent`) with the active feature name passed as `data` (`'todo'`, `'calendar'`, ...).
- If a dialog's template grows large, extract self-contained sections into child components (`pages/components/<name>/`). See [10-code-splitting.md](./10-code-splitting.md).

## User feedback

- Use `SnackbarService` (`core/services/snackbar.service.ts`) for success/error toasts: `snackbar.openSuccess('...')`, `snackbar.openError('...')`. Messages are German.
