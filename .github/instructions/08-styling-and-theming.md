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

## Mobile zoom

- Zooming is disabled globally: `src/index.html` sets `maximum-scale=1, user-scalable=no` on the viewport, and `src/styles.scss` sets `touch-action: manipulation` on `html`/`body`.
- `touch-action: manipulation` is the part that actually stops the accidental **double-tap zoom** on iOS Safari (which ignores `user-scalable=no`); do not remove it and do not add it per component — it is a global decision.
- Pinch zoom on iOS Safari cannot be fully suppressed by these two rules and is intentionally left alone (accessibility). Do not add JS gesture blockers for it.

## Theming via CSS variables

### Material first

The Material M3 theme is the single source of truth for base colors:

- `_material-palettes.scss` defines the tonal palettes.
- `_theme.scss` builds `$light-theme` / `$dark-theme` from them.
- `styles.scss` emits the theme and the global `--mat-sys-*` tokens for `html` (light) and `html[data-theme="dark"]` (dark).

`src/_css-variables.scss` only adds **app-specific aliases on top of** those tokens. Structural tokens are aliases of `--mat-sys-*` (so they switch automatically with the theme); only colors Material does not define (success, warning, calendar, priority) carry literal values and get a `[data-theme="dark"]` override.

Rules:

- **Surfaces, text, borders:** use the app tokens below.
- **Primary & error roles:** use Material tokens directly — `--mat-sys-primary`, `--mat-sys-on-primary`, `--mat-sys-primary-container`, `--mat-sys-on-primary-container`, `--mat-sys-error`, `--mat-sys-on-error`, `--mat-sys-error-container`, `--mat-sys-on-error-container`.
- **Success/warning:** use `--color-success` / `--color-warning` (foreground) and `--color-success-container` / `--color-warning-container` (background).
- **Never hard-code hex/rgb values** in component styles; derive overlays/state layers with `color-mix()` from a token.
- Only add `:host-context([data-theme="dark"])` overrides when a token alone genuinely cannot express the difference. Most components need none.

App tokens (`src/_css-variables.scss`):

| Purpose | Token | Material source |
| --- | --- | --- |
| Page/app background | `--bg-canvas` | `--mat-sys-surface` |
| Cards, toolbars, sidenavs, popovers | `--bg-surface` | `--mat-sys-surface-container-low` |
| Nested element inside a surface (icon tiles, section headers) | `--bg-surface-raised` | `--mat-sys-surface-container` |
| Filled input controls (text fields, steppers) | `--bg-input` | `--mat-sys-surface-container-highest` |
| Static subdued fill (badges, completed items, zebra stripes, muted cells) | `--bg-muted` | `--mat-sys-on-surface` @ 6% |
| Hover state layer | `--bg-hover` | `--mat-sys-on-surface` @ 8% |
| Strong hover/selection state layer | `--bg-hover-strong` | `--mat-sys-on-surface` @ 14% |
| Selected/active background | `--bg-selected` | `--mat-sys-primary-container` |
| Body/heading text | `--text-primary` | `--mat-sys-on-surface` |
| Labels/subheadings | `--text-secondary` | `--mat-sys-on-surface-variant` |
| Captions/metadata | `--text-caption` | `--mat-sys-on-surface` @ 76% |
| Hints/placeholders/empty states | `--text-subtle` | `--mat-sys-on-surface` @ 62% |
| Disabled text | `--text-disabled` | `--mat-sys-on-surface` @ 38% |
| Internal dividers | `--border-subtle` | `--mat-sys-outline-variant` @ 60% |
| Standard card/input borders | `--border-default` | `--mat-sys-outline-variant` |
| Emphasized borders | `--border-strong` | `--mat-sys-outline` |
| Shadows | `--shadow-sm` … `--shadow-xl` | `--mat-sys-shadow` |
| Dialog backdrop | `--overlay-backdrop` | `--mat-sys-scrim` |
| Scrollbar | `--scrollbar-thumb`, `--scrollbar-thumb-hover` | `--mat-sys-on-surface` |
| Primary hover shade | `--color-primary-hover` | `--mat-sys-primary` |
| Success (foreground/container) | `--color-success`, `--color-success-container` | custom |
| Warning (foreground/container) | `--color-warning`, `--color-warning-container` | custom |
| Text on user-chosen category colors | `--text-on-category-color` | custom |
| Priority (red/yellow/green) | `--priority-high`, `--priority-medium`, `--priority-low` | custom, identical in both modes |
| Calendar holiday | `--calendar-holiday-bg` | custom |
| Past calendar days | `--calendar-past-day-bg` | custom (light) / `--mat-sys-surface-container-high` (dark) |

When adding a token: prefer deriving it from `--mat-sys-*`. If it needs a literal color, add it to both `:root` and `[data-theme="dark"]` and document it here.


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
