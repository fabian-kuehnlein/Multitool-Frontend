# Styling & Theming

## SCSS everywhere

- All styling is SCSS. Component styles live in the co-located `*.component.scss`.
- Global/theme SCSS lives at `src/` root: `styles.scss`, `_theme.scss`, `_material-palettes.scss`, `_css-variables.scss`, `_breakpoints.scss`.
- 4-space indentation, consistent with the rest of the codebase.

## Class naming

- **Style classes, not raw elements.** Never write bare element selectors like `button { ... }`, `div { ... }` or `mat-icon { ... }` — target a class instead. A one-off element always gets its own class.
- **Raw element selectors are only OK for groups:** styling *all* elements of a kind at once (e.g. every button in the component should be red → `button { color: red; }`). As soon as individual elements need different styles, give them classes.
- **Class names must be meaningful** and say what the element *does*, not what it is generically: a button that deletes something is `delete-button`, not `button`.
- **The element kind belongs in the name** so a single read makes clear which element is styled. Append the kind as suffix: `button` → `-button`, a wrapper/`div` → `-container` (or `-wrapper`), `input` → `-input`, `label`/`span` → `-label`, `img` → `-icon`, etc.
- **Purpose first, kind second:** `delete-button`, `submit-button`, `toolbar-container`, `item-title`, `search-input`, `close-icon`.
- **Keep names short when unambiguous:** one delete button in a component is simply `delete-button`.
- **Add a feature/context prefix only when confusion is possible** (several similar elements or likely collisions): `feature-item-delete-button`, `feature-item-title`. Do not prefix every class with the feature name out of habit.

## Icon buttons

- **Buttons with an icon become a `MatIconButton`** (`<button matIconButton>`), so alignment, centering, sizing and touch targets come from Material instead of hand-rolled styles.
- If the button is not a pure icon button but contains an icon (e.g. text + icon), **give the icon itself the `matButtonIcon` directive** (`<mat-icon matButtonIcon>`). Never drop a bare `<mat-icon>` into a button without it.
- Use the current official syntax (`matIconButton`, `matButtonIcon`) — legacy names like `mat-icon-button` are deprecated. See [Material attribute syntax](./04-components.md#material-attribute-syntax).

## Page-level SCSS split

Page components split their styles into partials imported from the component file:

```scss
// some-page.component.scss
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
- Larger pages may add `_theme.scss` (dark-mode overrides), or feature-specific partials.
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
- Mirror the same ranges in TypeScript via the media service (`isMobile`, `isTablet`, `isLaptop`, `isDesktop` signals). Do not hard-code breakpoints elsewhere.

## Theming via CSS variables

- Colors, borders, shadows and accents come from `src/_css-variables.scss` as CSS custom properties, defined under `:root` (light) and `[data-theme="dark"]` (dark).
- **Always use `var(--token)` — never hard-code hex values** in component styles.

Common tokens:

| Group | Tokens |
| --- | --- |
| Backgrounds | `--bg-primary`, `--bg-secondary`, `--bg-surface`, `--bg-surface-alt`, `--bg-hover`, `--bg-active` |
| Text | `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-muted`, `--text-disabled` |
| Borders | `--border-default`, `--border-light`, `--border-medium`, `--border-strong` |
| Accents | `--accent-primary`, `--accent-success`, `--accent-warning` (+ `-light`, `-hover` variants) |
| Shadows | `--shadow-sm` … `--shadow-xl` |
| Priority colors | `--priority-high`, `--priority-medium`, `--priority-low` |
| Calendar | `--calendar-holiday-bg` |

- Add new tokens to `_css-variables.scss` in both the light and dark block when a color is reused.
- Theming of Material components happens via `_material-palettes.scss` + `_theme.scss`; dark mode is toggled by setting `data-theme="dark"` on `<html>` (via the theme service).

## Error colors

Error/danger coloring has **one unified mechanism** (`color="warn"` does nothing under M3 themes and must not be used):

- **Buttons:** `<button matButton class="error-button">` and `<button matIconButton class="error-icon-button">`. The classes are generated per theme in `styles.scss` and cover all button variants incl. hover/state layers.
- **Icons/text:** `<mat-icon class="error-icon">` and `<span class="error-text">`.
- **Free styles in component SCSS:** use the Material system tokens directly — `var(--mat-sys-error)`, `var(--mat-sys-on-error)`, `var(--mat-sys-error-container)` (light error background), `var(--mat-sys-on-error-container)` (text on that background). They are emitted globally by the M3 themes and are automatically correct for light and dark mode.
- Utility classes must sit **directly on the Material element**, never on a wrapper. Never hand-write hex values or legacy danger variables for errors.

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

- Target Material internals with `::ng-deep` only where unavoidable (e.g. touch targets, menu items). Scope it under your own class and never write global `::ng-deep` at file top-level.
- Use the same plain section-comment style as TypeScript (`// Section`) to organize longer SCSS files — avoid decorative separator lines.

## Dialog sizing

- Pick the dialog layout by content amount — the action-button rules for both patterns live in [04-components.md](./04-components.md#dialogs):
  - **Full-screen** — content-rich dialogs (forms, lists): on mobile use `width`/`height`/`minWidth`/`maxWidth` of `'100vw'`/`'100vh'` plus `panelClass: 'full-screen-dialog'` (styling provided globally — reuse it rather than duplicating it per dialog). On desktop use explicit `width`/`minWidth`/`maxWidth`.
  - **Compact** — low-content dialogs (confirmations, short choices): never full-screen. On mobile use `width: '90vw'`, `maxWidth: '90vw'`, no height and no `panelClass`, so the dialog auto-sizes and keeps its rounded corners.
