# Repository Conventions — Multitool Frontend

This folder is the **contract** for how code is written in this Angular 22 frontend. Before writing or changing code, read the file(s) that apply to your task and follow them. The rules describe the *desired* state — if existing code deviates, new code should still follow these rules (and, where cheap, old code should be migrated toward them).

## Keeping these conventions current (must-do)

These rules are **not static** — they evolve together with the codebase. Whenever you make a **structural or architectural decision**, the conventions MUST be updated in the same commit, so the documentation and the code never drift apart. This applies to any change that establishes a reusable pattern or a new rule, for example:

- Centralizing a cross-cutting concern (e.g. moving snackbars/user feedback, forms, or components into a shared/centralized place).
- Introducing a new folder, responsibility bucket, or architectural pattern.
- Changing how components, services, or dialogs are structured or reused.
- Adding or renaming files/folders in a way future code should follow.
- Any decision that, if not documented, an agent could later get wrong or would have to rediscover.

**Rule of thumb:** if you had to *think* about how something should be structured, or you built something you would expect future code to mirror, stop and write it down here. Update the relevant file(s) in `.github/instructions/`, add new files when a new theme emerges, adjust the index in this README and the task→file map, and keep the quick summaries in `AGENTS.md` in sync — all in the same commit as the code change.

## How to use this documentation

Decide what your change touches, then read the matching file(s):

| If your task involves… | Read |
| --- | --- |
| Anything at all (naming, structure, rules) | [01-angular-fundamentals.md](./01-angular-fundamentals.md) + [02-naming-conventions.md](./02-naming-conventions.md) |
| Creating/editing a **component** or dialog | [04-components.md](./04-components.md) |
| **State**, services, signals | [05-state-and-services.md](./05-state-and-services.md) |
| **HTTP**, models, DTOs | [06-http-and-models.md](./06-http-and-models.md) |
| **Routes**, guards, auth | [07-routing-and-auth.md](./07-routing-and-auth.md) |
| **Styling**, theming, SCSS | [08-styling-and-theming.md](./08-styling-and-theming.md) |
| **Dates**, localisation, German UI | [09-dates-and-localization.md](./09-dates-and-localization.md) |
| **Folder layout**, where code lives | [03-project-structure.md](./03-project-structure.md) |
| A **file getting too large** (split it) | [11-code-splitting.md](./11-code-splitting.md) |
| **Snackbars**, error/success feedback | [12-snackbars-and-user-feedback.md](./12-snackbars-and-user-feedback.md) |
| **Committing**, verifying, building | [10-git-and-workflow.md](./10-git-and-workflow.md) |

## Index

| File | Content |
| --- | --- |
| [01-angular-fundamentals.md](./01-angular-fundamentals.md) | Framework basics: Angular 22, standalone, zoneless, change detection, DI, imports, formatting, TypeScript rules |
| [02-naming-conventions.md](./02-naming-conventions.md) | Detailed naming rules: components, services, variables, functions, files/folders, enums/interfaces/classes, SCSS classes |
| [03-project-structure.md](./03-project-structure.md) | Folder layout, where each kind of code lives, adding a new feature |
| [04-components.md](./04-components.md) | Component conventions, templates, control flow, dialogs, reusable form components, Material usage |
| [05-state-and-services.md](./05-state-and-services.md) | Signals, state management, state vs. HTTP service split |
| [06-http-and-models.md](./06-http-and-models.md) | HTTP services, API base URL, models/DTOs/enums, barrel exports, backend contract |
| [07-routing-and-auth.md](./07-routing-and-auth.md) | Lazy-loaded routes, guards, JWT interceptor, auth flow |
| [08-styling-and-theming.md](./08-styling-and-theming.md) | SCSS structure, class naming, breakpoints, CSS variables, dark mode, error colors |
| [09-dates-and-localization.md](./09-dates-and-localization.md) | dayjs, German locale, date/time formats, UI language |
| [10-git-and-workflow.md](./10-git-and-workflow.md) | Commands, verification, environment gotcha, commit message style |
| [11-code-splitting.md](./11-code-splitting.md) | Splitting oversized TS files: responsibility buckets, `mappers/`/`logic/`, form services, child components |
| [12-snackbars-and-user-feedback.md](./12-snackbars-and-user-feedback.md) | SnackbarService API, global HTTP error interceptor, `SKIP_HTTP_ERROR_SNACKBAR`, when to show success feedback |

## Quick reference

- **Framework**: Angular 22, standalone components, zoneless change detection, signals.
- **Style**: SCSS, 4-space indent, single quotes, Strict TypeScript.
- **UI language**: German.
- **Naming**: PascalCase classes, camelCase members/functions, UPPER_SNAKE_CASE constants, kebab-case files with type suffix (see [02](./02-naming-conventions.md)).
- **Verification**: `npm run build` or `npx tsc --noEmit -p tsconfig.app.json`.
- **No lint or test setup exists** — CI only builds.
