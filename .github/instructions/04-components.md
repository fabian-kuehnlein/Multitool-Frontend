# Components

## Declaration

Every component is standalone and follows this shape:

```ts
import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UI_MODULES } from '../../../shared/utilities/material-ui';
import { ServiceExample } from '../services/service-example.service';

@Component({
    selector: 'app-component-to-implement',
    standalone: true,
    imports: [CommonModule, UI_MODULES],
    templateUrl: './component-to-implement.component.html',
    styleUrl: './component-to-implement.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class ComponentToImplement {
    // ...
}
```

- Selector prefix is always `app-`.
- `imports` start with `CommonModule` and the shared `UI_MODULES`; add feature-specific modules explicitly after.
- Use external `templateUrl` + `styleUrl`; only inline templates for trivial one-liners.
- Set `changeDetection: ChangeDetectionStrategy.Eager` on every component.

## Injecting dependencies

- Use `inject()` for all dependencies, declared as fields near the top of the class:

```ts
protected readonly serviceExample = inject(ServiceExample);
private readonly dialog = inject(MatDialog);
private readonly snackbar = inject(SnackbarService);
```

- Members read by the template are `protected` (or `public` when needed); everything else is `private`. Add `readonly` where possible.

## Local state

- Use signals for any component state that renders: `readonly sortBy = signal<'priority' | 'dueDate' | 'title'>('priority')`.
- Derive display data with `computed()`; never mutate arrays in place — always create new references (`this.selectedItemIds.set(new Set(...))`).
- Wire global state to the template by exposing service signals: `readonly isMobile = this.mediaService.isMobile;`.

## Templates

- Use the **new built-in control flow** only: `@if`, `@else`, `@for (...; track ...)`, `@switch`. Do **not** use `*ngIf`, `*ngFor`, `ngSwitch`.
- Always provide a `track` expression in `@for`.
- Keep one logical block per `@if`/`@for` with consistent indentation; format the template so its structure mirrors the class's responsibilities.
- Call component methods in bindings where that keeps the template declarative, but prefer precomputed `computed()` signals for anything expensive or reused.
- Use `async` pipe or `toSignal()` for observables; do not manually subscribe in templates.

## Material attribute syntax

- **Always use the current, officially recommended attribute/directive syntax for the installed Angular Material version (^22).** Before using a Material component, check the official docs at <https://material.angular.io/> (start at <https://material.angular.io/components>). This applies to *every* Material component, not just buttons.
- Since Angular Material v19 each component exposes a single directive named after the component; the variant is set via the attribute value:
  - Buttons: `matButton` (basic/text), `matButton="elevated"`, `matButton="outlined"`, `matButton="filled"`, `matButton="tonal"`.
  - Icon buttons: `matIconButton` (legacy `mat-icon-button` is deprecated).
  - FABs: `matFab`, `matMiniFab`, `matFab extended` (extended is a bare attribute).
  - Icons inside a button get `matButtonIcon`:

  ```html
  <button matButton="filled">
      <mat-icon matButtonIcon>save</mat-icon>
      Speichern
  </button>
  ```

- **Prefer the new syntax over the legacy attribute names** (`mat-button`, `mat-raised-button`, `mat-flat-button`, `mat-stroked-button`, `mat-icon-button`, `mat-fab`, `mat-mini-fab`, ...) — they are deprecated.
- Add `aria-label` on icon-only buttons (and other icon-only elements) where the icon has no visible text.

## Lifecycle

- Implement `OnInit` for kick-off work (e.g. `ngOnInit(): void { this.serviceExample.loadItems(); }`).
- Use `ngOnDestroy` to clean up subscriptions — either via `takeUntil(destroy$)` with a `Subject<void>` or by relying on signals/`toSignal`.
- `viewChild()`/`viewChildren()` are the signal-based alternatives to `@ViewChild` — prefer them.
- `@HostListener` is fine for keyboard shortcuts, but consider the app-wide hotkey service when the shortcut is global.

## Dialogs

- Dialogs are standalone components under `<feature>/pages/components/<name>/` or `shared/components/<name>/`.
- Inject `MatDialogRef<DialogComponent>` and the typed data with `MAT_DIALOG_DATA` via `inject`:

```ts
private readonly dialogRef = inject(MatDialogRef<ComponentToImplementDialog>);
private readonly data = inject<{ item?: ItemModel }>(MAT_DIALOG_DATA);
```

- **Pick the mobile layout by content amount** — two dialog patterns exist, both driven by the media-service breakpoints (`isMobile()` in TS, `bp.mobile` in SCSS):
  - **Full-screen** — content-rich dialogs (forms, lists). On mobile open with `width: '100vw'`, `height: '100vh'`, `minWidth/maxWidth: '100vw'` and `panelClass: 'full-screen-dialog'`.
  - **Compact** — low-content dialogs (confirmations, short choices). Never full-screen: on mobile use `width: '90vw'` (no height, no `panelClass`) so the dialog auto-sizes and keeps Material's rounded corners; it renders as a centered card (title/message centered on mobile).
- **Action button order** in full-screen dialogs, top to bottom: destructive action (full width) → secondary actions in one row → primary action (`matButton="filled"`, full width). Mark the buttons: destructive → `error-button`, primary → `primary-action`.
- **The full-screen actions area is uniform across dialogs** (mobile). The host needs `display: flex; flex-direction: column; height: 100%` on mobile and the content area `flex: 1; overflow-y: auto` so the actions bar stays pinned to the bottom:

  ```scss
  @include bp.mobile {
      flex-wrap: wrap;
      justify-content: flex-end;
      padding: 16px;
      margin-top: auto;
      border-top: 1px solid var(--border-light);

      button { flex: 1; min-width: 0; }
      .error-button { flex: 1 1 100%; margin-bottom: 8px; }
      .primary-action { flex: 1 1 100%; }
  }
  ```

- **Compact dialog actions** (mobile) put the secondary action on its own full-width row on top and the main actions side by side below it, primary last:

  ```scss
  @include bp.mobile {
      flex-wrap: wrap;

      .cancel-button { width: 100%; }
      button:not(.cancel-button) { flex: 1; min-width: 0; }
  }
  ```

- **Form-heavy dialogs get a `<name>-form.service.ts`** co-located next to them. It owns `buildForm()` + validators, patch/init for edit mode, and form-value → DTO mapping. The dialog component keeps only open/save/close orchestration and template-bound `computed` signals. Provide the service in the component's `providers` array. See [11-code-splitting.md](./11-code-splitting.md).
- Use the shared `ConfirmDialogComponent` (`shared/components/confirm-dialog`) to open a confirm dialog anywhere in the app — e.g. before destructive actions — instead of rolling your own. Pass the text via `data` (`title`, `message`, `confirmText`, `cancelText`, `isDestructive`):

```ts
const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    data: {
        title: 'Löschen',
        message: `Möchtest du "${item.title}" wirklich löschen?`,
    },
});
```

- Read the result via `dialogRef.afterClosed().subscribe((result) => ...)` and only act when a value is returned — `result` is `true` when the user confirmed.
- The sidenav is opened as a dialog with the active feature name passed as `data`.
- If a dialog's template grows large, extract self-contained sections into child components (`pages/components/<name>/`). See [11-code-splitting.md](./11-code-splitting.md).

## Reusable form components

- When a group of form fields is needed in several places, extract it into a **shared** component under `shared/components/<name>/` and reuse it like a child component.
- Such a component receives the parent `FormGroup` via a **signal input** and renders the fields with plain `formControlName`. The controls it binds must already exist in the parent form (the shared component does **not** build or add them).
- Bind the Angular `formGroup` **directive** on the component's root wrapper element so nested `formControlName`s resolve. **Do not** name the signal input `formGroup` (it collides with the `FormGroupDirective` input) — use a distinct name like `parentForm`:

  ```html
  <app-recurrence-form [parentForm]="myForm" />
  ```

  ```html
  <div [formGroup]="parentForm()" class="recurring-container">
      <mat-form-field>
          <mat-select formControlName="recurrenceFrequency">...</mat-select>
      </mat-form-field>
  </div>
  ```

- Any view logic that only this field group needs (`getFrequencyLabel()`, `changeInterval()`, ...) lives inside the shared component, not the parent.

## User feedback

- Use `SnackbarService` (`core/services/snackbar.service.ts`) for success/error toasts: `snackbar.openSuccess('...')`, `snackbar.openError('...')`. Messages are German. Full rules in [12-snackbars-and-user-feedback.md](./12-snackbars-and-user-feedback.md).
