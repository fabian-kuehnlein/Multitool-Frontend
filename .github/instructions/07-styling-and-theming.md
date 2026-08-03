# Styling & Theming

## SCSS everywhere

- All styling is SCSS. Component styles live in the co-located `*.component.scss`.
- Global/theme SCSS lives at `src/` root: `styles.scss`, `_theme.scss`, `_material-palettes.scss`, `_css-variables.scss`, `_breakpoints.scss`.
- 4-space indentation, consistent with the rest of the codebase.

## Page-level SCSS split

Page components split their styles into partials imported from the component file:

```scss
// todo.component.scss
@use "desktop";
@use "mobile";

:host {
    display: block;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    box-sizing: border-box;
}
```

- `_desktop.scss` — styles for desktop/tablet layouts.
- `_mobile.scss` — mobile overrides; wrap breakpoint-specific rules in `@include bp.mobile { ... }`.
- Larger pages may add `_theme.scss` (dark-mode overrides), `_fullcalendar.scss`, etc. (see `calendar/pages/`).
- Import with `@use "desktop";` (no underscore/extension).

## Breakpoints

- Single source of truth: `src/_breakpoints.scss`.

```scss
$breakpoint-mobile: 600px;
$breakpoint-tablet: 1024px;
$breakpoint-laptop: 1640px;

@mixin mobile { @media (max-width: #{$breakpoint-mobile}) { @content; } }
@mixin tablet  { @media (min-width: #{$breakpoint-mobile + 1px}) and (max-width: #{$breakpoint-tablet}) { @content; } }
@mixin laptop  { @media (min-width: #{$breakpoint-tablet + 1px}) and (max-width: #{$breakpoint-laptop}) { @content; } }
```

- Use the mixins (`@use "../../../../_breakpoints" as bp;` then `@include bp.mobile { ... }`).
- Mirror the same ranges in TypeScript via `MediaService` (`core/services/media.service.ts`): `isMobile`, `isTablet`, `isLaptop`, `isDesktop` signals. Do not hard-code breakpoints elsewhere.

## Theming via CSS variables

- Colors, borders, shadows and accents come from `src/_css-variables.scss` as CSS custom properties, defined under `:root` (light) and `[data-theme="dark"]` (dark).
- **Always use `var(--token)` — never hard-code hex values** in component styles.

Common tokens:

| Group | Tokens |
| --- | --- |
| Backgrounds | `--bg-primary`, `--bg-secondary`, `--bg-surface`, `--bg-surface-alt`, `--bg-hover`, `--bg-active` |
| Text | `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-muted`, `--text-disabled` |
| Borders | `--border-default`, `--border-light`, `--border-medium`, `--border-strong` |
| Accents | `--accent-primary`, `--accent-danger`, `--accent-success`, `--accent-warning` (+ `-light`, `-hover`, `-dark` variants) |
| Shadows | `--shadow-sm` … `--shadow-xl` |
| Priority colors | `--priority-high`, `--priority-medium`, `--priority-low` |
| Calendar | `--calendar-holiday-bg` |

- Add new tokens to `_css-variables.scss` in both the light and dark block when a color is reused.
- Theming of Material components happens via `_material-palettes.scss` + `_theme.scss`; dark mode is toggled by setting `data-theme="dark"` on `<html>` (`ThemeService`).

## Dark mode

- Component-level dark overrides use `:host-context([data-theme="dark"])`:

```scss
:host-context([data-theme="dark"]) {
    .toolbar-container {
        background-color: var(--bg-surface) !important;
    }
}
```

- Prefer CSS variables over `:host-context` overrides whenever the variable alone suffices — most components never need explicit dark-mode rules.

## Material internals

- Target Material internals with `::ng-deep` only where unavoidable (e.g. `.mat-mdc-*` touch targets, menu items). Scope it under your own class and never write global `::ng-deep` at file top-level.
- Reuse the section-comment style (`// ── Section ──...`) to organize longer SCSS files.

## Dialog sizing

- Dialogs are full-screen on mobile via the `MediaService` pattern; on desktop use explicit `width`/`minWidth`/`maxWidth`. Reuse `panelClass: 'full-screen-dialog'` (styling provided globally) rather than duplicating it per dialog.
