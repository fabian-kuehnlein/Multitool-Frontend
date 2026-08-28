# Angular Fundamentals

## Stack

- Angular **22** (see `package.json`), compiled with the modern `@angular/build` application builder.
- TypeScript `~6.0.x`, strict mode (`strict`, `noImplicitOverride`, `strictTemplates`, `isolatedModules`).
- RxJS `~7.8`.
- dayjs for all date handling (never `moment`, never `Date` arithmetic where dayjs fits, see [09-dates-and-localization.md](./09-dates-and-localization.md)).
- Angular Material 22 + Angular CDK.

## Standalone everywhere

- The app has **no NgModules**. All components, directives and pipes are **standalone** and declare `standalone: true` with their `imports` inline.
- Never create or reintroduce `NgModule`s.
- Use `imports: [CommonModule, UI_MODULES, ...]`; Material modules come via the centralized `UI_MODULES` array (`src/app/shared/utilities/material-ui.ts`). Add Material modules there when needed, do not import them ad hoc in every component — except when a single component needs a rarely used module.

## Zoneless change detection

- The app runs zoneless (`provideZonelessChangeDetection()` in `app.config.ts`).
- Never rely on zone.js. State changes must flow through **signals** so Angular can detect them.
- Don't call `NgZone`, `markForCheck`, or `detectChanges` manually.

## Change detection strategy

- Every component sets `changeDetection: ChangeDetectionStrategy.Eager`.
  `Eager` is the Angular 20+ name for the previous `Default` strategy. Do not use `OnPush` (components must react to signal updates).
- Keep the ordering in `@Component` metadata consistent: `selector`, `standalone`, `imports`, `templateUrl`/`template`, `styleUrl`, `changeDetection`, then optional extras (`animations`, `host`, ...).

## Dependency injection

- Prefer the **`inject()` function** at class field level:

  ```ts
  private readonly dialog = inject(MatDialog);
  protected readonly serviceExample = inject(ServiceExample);
  ```

- Constructor injection is only acceptable where required by a legacy pattern; new code always uses `inject()`.
- Injectables are provided via `providedIn: 'root'` (or in a component `providers` array for per-instance form services).

## Formatting

- 4-space indentation, no tabs (`.editorconfig`).
- Single quotes for strings; trailing commas in multiline lists; semicolons at end of statements.
- One statement per line; keep lines reasonable.
- Larger files may be grouped with plain section comments, e.g. `// Signals & state`.
- Do **not** use decorative comment separators such as `// --- Section ---`, `// ------`, or full-width `// ====` / `// ****` lines. They are not human-reproducible — reproducing them exactly means counting characters. Keep comments simple: a short `// Section` label on its own line.

## Imports

- Order imports by group, from general to specific, blank line between groups:
  1. Angular core (`@angular/core`, `@angular/common`, `@angular/forms`, ...)
  2. Angular Material (`@angular/material/...`)
  3. Other libraries (`@fullcalendar/*`, `dayjs`, `rxjs`, `lodash`)
  4. App code — relative paths (`../models/...`, `../../shared/...`)
- Import types and values explicitly; rely on `models/index.ts` barrels where they exist.
- Naming of identifiers follows [02-naming-conventions.md](./02-naming-conventions.md).

## TypeScript rules

- Prefer `interface` for data shapes, `type` for unions/aliases.
- Be explicit about nullability: `startTime: string | null` — never lie about optionality.
- Use `readonly` for injected dependencies and derived signals.
- Avoid `any` unless there is genuinely no better type (some third-party interop code is the accepted exception).
- Prefer `computed()` over repeating derived logic; prefer `signal()` over plain fields for anything that renders.
