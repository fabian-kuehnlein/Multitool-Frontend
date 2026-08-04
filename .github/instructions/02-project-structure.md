# Project Structure

## Layout

```
src/
├── main.ts                          # bootstrapApplication + appConfig
├── styles.scss                      # global styles
├── _breakpoints.scss                # shared SCSS breakpoint mixins
├── _css-variables.scss              # light/dark theme CSS custom properties
├── _material-palettes.scss          # Angular Material palette definitions
├── _theme.scss                      # Angular Material theme configuration
├── environments/
│   ├── environment.ts               # base (always replaced via fileReplacements)
│   ├── environment.development.ts   # dev API base
│   └── environment.prod.ts          # prod API base (overwritten by scripts/set-env.js)
└── app/
    ├── app.config.ts                # root ApplicationConfig providers
    ├── app.routes.ts                # all routes, lazy-loaded
    ├── app.component.*              # root shell
    ├── core/                        # singletons used app-wide
    │   ├── auth/                    # guards, interceptors, pages, services
    │   ├── date/                    # dayjs Material DateAdapter
    │   ├── layout/                  # sidenav etc.
    │   └── services/                # global services (theme, media, snackbar, hotkey)
    ├── modules/                     # one folder per feature
    │   └── <feature>/               # e.g. calendar, custom-table, todo, work-time-planner
    │       ├── models/              # dtos/, enums/, metadata/, ui/ + index.ts barrel
    │       ├── mappers/             # pure data transformations (model ↔ DTO ↔ third-party)
    │       ├── logic/               # pure business rules & calculations
    │       ├── utilities/           # config/constants + tiny generic helpers (feature-specific)
    │       ├── pages/               # routed components
    │       │   └── components/      # child/dialog components per feature
    │       └── services/            # <feature>-http.service.ts + <feature>.service.ts
    └── shared/                      # reusable across features
        ├── components/
        ├── models/
        ├── services/
        └── utilities/
```

> Splitting files across `mappers/`, `logic/`, `utilities/` and form services is covered in [10-code-splitting.md](./10-code-splitting.md).

## Rules

- **Feature modules** live under `src/app/modules/<feature>/` with kebab-case names (`work-time-planner`).
- Each feature keeps its own `models/`, `mappers/`, `logic/`, `pages/`, `services/`, `utilities/`. Do **not** put feature code in `shared/`.
- **`core/`** holds app-wide singletons: auth, routing-adjacent pieces, layout, global services. It must not contain feature logic.
- **`shared/`** holds genuinely reusable pieces used by two or more features (e.g. `ConfirmDialogComponent`, `CategoryService`, `material-ui.ts`). If only one feature uses it, keep it in that feature.
- **Routed components** (one per route) go directly in `<feature>/pages/` as `<feature>.component.*`. Everything they render as dialogs or child components goes in `<feature>/pages/components/<name>/`.
- **Models** live in `<feature>/models/`. When a feature grows, split into `dtos/`, `enums/`, `metadata/`, `ui/` subfolders and expose them through a barrel `models/index.ts` (see `custom-table`). Small features may keep a single `<name>.model.ts`.
- **HTTP vs. state**: every feature that talks to the backend has exactly two services — `<feature>-http.service.ts` (raw `HttpClient`) and `<feature>.service.ts` (signals/state). See [04-state-and-services.md](./04-state-and-services.md).
- **SCSS partials** for a page (`_desktop.scss`, `_mobile.scss`, optional `_theme.scss`) are co-located next to the page component. See [07-styling-and-theming.md](./07-styling-and-theming.md).
- Component files always travel together: `*.component.ts`, `*.component.html`, `*.component.scss`.
- Files are named by type suffix: `.component.`, `.service.`, `.model.`, `.guard.ts`, `.interceptor.ts`, `.config.ts`, `.mapper.ts`, `.logic.ts`, `.util.ts`.

## When adding a new feature

1. Create `src/app/modules/<feature>/` with `models/`, `mappers/`, `logic/`, `pages/`, `services/`, `utilities/`.
2. Add the page component to `pages/`.
3. Register a lazy route in `app.routes.ts` (see [06-routing-and-auth.md](./06-routing-and-auth.md)).
4. Add the feature to the sidenav (`core/layout/sidenav/`).
