# Snackbars & User Feedback

## Central service

All snackbars go through `SnackbarService` (`core/services/snackbar.service.ts`). Components and
services never inject `MatSnackBar` directly.

| Method | Use case | Panel class |
| --- | --- | --- |
| `openSuccess(message)` | Confirmation of a user-triggered mutation | `success-snackbar` (neutral, theme-aware) |
| `openError(message)` | Known, specific failure with a custom message | `error-snackbar` (red in both themes) |
| `openHttpError(err)` | Generic status-based HTTP error message | `error-snackbar`, multi-line variants add `multiline-snackbar` |

Success messages are **not** green — they use a neutral color that adapts to the theme
(`--snackbar-neutral-bg` / `--snackbar-neutral-text` in `_css-variables.scss`).

Global defaults (duration 5000 ms, centered top position) live in `MAT_SNACK_BAR_DEFAULT_OPTIONS`
(`app.config.ts`). Never put a `panelClass` there — each snackbar type sets its class explicitly.

## Generic HTTP errors are handled globally

The `httpErrorInterceptor` (`core/interceptors/http-error.interceptor.ts`) shows a generic,
status-based error snackbar for **every failed HTTP request**. Therefore:

- Do **not** add per-call `error:` handlers whose only job is showing a generic error snackbar.
  The interceptor already covers it (also for silent handlers like `error: () => {}`).
- Status 401 is excluded — the `authInterceptor` logs the user out instead.

### Suppressing the generic snackbar

When a call site shows its **own specific error message**, suppress the generic one to avoid
two snackbars for the same failure:

```ts
import { HttpContext } from '@angular/common/http';
import {
    SKIP_HTTP_ERROR_SNACKBAR,
} from '../../../core/interceptors/http-error.interceptor';

private readonly skipErrorSnackbarContext = new HttpContext().set(
    SKIP_HTTP_ERROR_SNACKBAR,
    true,
);

this.featureService.updateSomething(dto, this.skipErrorSnackbarContext).subscribe({
    next: () => this.snackbar.openSuccess('Eintrag aktualisiert'),
    error: () => this.snackbar.openError('Der Eintrag konnte nicht aktualisiert werden.'),
});
```

Thread an optional `HttpContext` parameter through the feature service into the HTTP service
(`http.put(url, body, { context })`) for this. See `calendar.service.ts` /
`category-http.service.ts` for examples.

## When to show success feedback

- Every **explicit** user action gets exactly one confirmation: creating → „… erstellt",
  updating → „… aktualisiert", deleting → „… gelöscht" (German UI).
- Multi-step flows show **one** message at the end of the flow, not one per request
  (e.g. moving an instance out of a series = create + exclude → single „Termin verschoben").
- **Auto-saves stay silent**: background/persistence-style saves that fire frequently
  (e.g. editing work days cell by cell in the Work-Time-Planner) must not toast on every save.
  Errors still surface through the global interceptor.
- Everything that runs through an **explicit dialog/save action** is a normal update flow and
  follows the standard rules above: success confirmation plus a specific error message
  (with `SKIP_HTTP_ERROR_SNACKBAR`), e.g. saving the Work-Time-Planner settings.
