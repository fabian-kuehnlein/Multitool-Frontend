# Repository Conventions — Multitool Frontend

This folder documents the conventions for this Angular 22 frontend. The rules
here are the contract for how code should be written in this repository. They
describe the *desired* state — if existing code deviates, new code should still
follow these rules (and, where cheap, old code should be migrated toward them).

## Index

| File | Content |
| --- | --- |
| [01-angular-fundamentals.md](./01-angular-fundamentals.md) | Framework basics: Angular 22, standalone, zoneless, change detection, DI, naming, formatting |
| [02-project-structure.md](./02-project-structure.md) | Folder layout and where each kind of code lives |
| [03-components.md](./03-components.md) | Component conventions, templates, control flow, dialogs, Material usage |
| [04-state-and-services.md](./04-state-and-services.md) | Signals, state management, service split (state vs. HTTP) |
| [05-http-and-models.md](./05-http-and-models.md) | HTTP services, API base URLs, models/DTOs/enums, barrel exports |
| [06-routing-and-auth.md](./06-routing-and-auth.md) | Lazy-loaded routes, guards, JWT interceptor, auth flow |
| [07-styling-and-theming.md](./07-styling-and-theming.md) | SCSS structure, breakpoints, CSS variables, dark mode |
| [08-dates-and-localization.md](./08-dates-and-localization.md) | dayjs, German locale, date/time formats, UI language |
| [09-git-and-workflow.md](./09-git-and-workflow.md) | Commands, verification, environment gotcha, commit message style |
| [10-code-splitting.md](./10-code-splitting.md) | How to split oversized TS files: responsibility buckets, `mappers/`/`logic/`, form services, child components |

## Quick reference

- **Framework**: Angular 22, standalone components, zoneless change detection, signals.
- **Style**: SCSS, 4-space indent, single quotes, Strict TypeScript.
- **UI language**: German.
- **Verification**: `npm run build` or `npx tsc --noEmit -p tsconfig.app.json`.
- **No lint or test setup exists** — CI only builds.
