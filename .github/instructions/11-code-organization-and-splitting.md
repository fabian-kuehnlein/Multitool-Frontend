# Code Organization & Splitting

## Goal

Give every file **exactly one clear responsibility**. Code is split so that logic has one obvious home, shared behavior is centralized, and a reader can find things without searching. Smaller files are usually easier to read, but **file length is not a criterion**: there is no line budget and no rule that a file must be split above a certain number of lines. A long file that does one coherent thing can stay as it is; a short file that mixes unrelated concerns should be split.

**One concept per file:** a source file focuses on a single concept — usually one component, directive or service per file. A file *may* hold more than one class when they are small and belong to one concept (e.g. a component with a tiny local helper class), but when in doubt pick the approach that keeps responsibilities clearly separated.

This is the methodology for organizing code and splitting it by responsibility. It describes the *target* structure; existing code may not match it yet — migrate towards it when you touch the code.

## Triggers — when to split

The triggers are always about responsibilities and navigation, never line counts:

1. The file has **more than one responsibility** (e.g. a mapper that also parses strings, a component that also computes business rules).
2. Unrelated concerns make the file hard to follow — finding a method means scrolling past code that has nothing to do with it, or the imports span many unrelated things.
3. The same derived state or helper is **duplicated** in multiple files.
4. The template mixes several distinct sections, so the matching component carries dozens of handler methods for unrelated concerns.

## The five responsibility buckets

Every piece of TypeScript belongs to exactly one bucket. A file named after one bucket must not silently do another bucket's work.

| # | Bucket | Folder | File suffix | Export style | Owns |
| --- | --- | --- | --- | --- | --- |
| 1 | View orchestration | `pages/`, `pages/components/` | `.component.ts` | `@Component` class | Signals the template reads, event handlers, dialog orchestration |
| 2 | State & persistence | `services/` | `.service.ts`, `-http.service.ts` | `@Injectable` class | Signals/state, HTTP calls |
| 3 | Domain logic | `logic/` | `.logic.ts` | pure functions | Business rules & calculations |
| 4 | Mappings | `mappers/` | `.mapper.ts` | pure functions | Transformations between models/DTOs/third-party shapes |
| 5 | Config & constants | `utilities/` | `.config.ts`, `.constants.ts` | `const` | Option objects, label maps, default values |

Rules:

- **One bucket per file.** A `*.mapper.ts` only maps; it never parses rules or computes business logic. A `*.logic.ts` never touches `HttpClient` or signals.
- **Pure modules (buckets 3–5) are plain functions/constants — never classes, never static classes, never `@Injectable`.** Only buckets 1–2 use classes. If a helper needs no injected dependencies, it must not be a service.
- **Dependency direction:** components and state services may depend on any bucket; pure modules may not depend on services or components. `logic/` may depend on `mappers/`/models, `mappers/` may depend on models — never the other way around.
- **Type everything.** No `any` in pure modules. Define intermediate types where a mapping crosses shapes.

## Target feature layout

```
modules/<feature>/
├── models/                  # DTOs, enums, metadata (barrel index.ts)
├── mappers/                 # data transformations (model ↔ DTO ↔ third-party)
│   └── item.mapper.ts
├── logic/                   # pure business rules & calculations
│   └── scheduling.logic.ts
├── utilities/               # config objects & tiny generic helpers
│   └── feature.config.ts
├── services/
│   ├── <feature>.service.ts        # state (signals) + orchestration
│   └── <feature>-http.service.ts   # raw HttpClient, one per controller
├── pages/
│   ├── <feature>.component.ts|html|scss
│   └── components/
│       ├── <dialog>/
│       │   ├── <dialog>.component.ts|html|scss
│       │   └── <dialog>-form.service.ts     # form build/patch/map (optional)
│       └── <child>/                       # extracted template sections
```

## The split decision tree

For every file that mixes responsibilities, walk this list in order:

1. **Does it hold view state the template reads or open dialogs?** → keep in the component, or extract the section as a child component.
2. **Does it call HTTP or hold state shared across components?** → `services/`.
3. **Does it transform data between shapes?** → `mappers/`.
4. **Does it encode business rules or calculations?** → `logic/`.
5. **Is it an option object, label map or default value?** → `utilities/` (config/constants file).
6. **Does it build a `FormGroup`, patch it, or map to a DTO for a dialog?** → extract `<name>-form.service.ts` next to the dialog component.
7. **Does it render a large self-contained block of the template?** → extract a child component with its own `.ts/.html/.scss`.

Start with the lowest-risk extractions (3–5), then do forms (6), then components (7).

## Splitting components

Components are the most common place where concerns mix. Four levers, applied in order:

### 1. Extract child components for template sections

Every self-contained block of markup plus its handlers becomes a child component under `pages/components/<name>/` with typed `@Input()`/`@Output()`. This removes **both** HTML and matching TS from the parent.

For example, a page that shows a sidebar list, an inline editor, and a toolbar could be split into `sidebar`, `inline-editor`, and `toolbar` child components. The parent then keeps only cross-cutting orchestration (which item is loaded, which dialog opens, drag & drop between top-level sections) and passes data/events to the children.

### 2. Extract form services

A dialog that builds a `FormGroup`, patches it and maps the result to a DTO gets a `<name>-form.service.ts` co-located with the dialog:

- `buildForm()` + validators
- patch/init logic for edit mode
- form-value → DTO mapping (`getCreateData()`, `getUpdateData()`)

The component keeps only open/save/close orchestration and template-bound computed signals. Provide the service in the component's `providers` array, not `providedIn: 'root'`.

### 3. Lift shared view state to the feature service

If two components need the same state (pagination, selected entity, expanded ids), it lives in the feature service — never duplicated. **Derived signals are computed once, in the service.** If a component re-derives variants the service already exposes, it should consume the service's derived signals or move the extra derivation into the service.

### 4. Keep only what the template binds

Component TS should be: injected dependencies, a handful of template-bound signals, and the handler methods. Business rules, mappings and formatting helpers do not live in the component.

## Splitting state services

When a state service mixes several responsibilities:

1. **Extract pure calculations to `logic/` first.** Calculation helpers, normalization functions and default-setting objects are all pure → move them to `logic/` and `utilities/`. The service keeps state, orchestration and any pending-change bookkeeping.
2. Only if the service still has multiple independent state domains, split into several `<feature>-<domain>.service.ts` files. Prefer this over one service that mixes unrelated domains.
3. HTTP services stay **one per backend controller** — do not split per endpoint.

## Splitting mappers & utilities

- **Static classes become module functions.** A mapper class that mixes mapping, parsing, and matching is exactly what this methodology forbids. Replace it with pure exported functions.
- **Split by concern, one file each:**
  - `mappers/<entity>.mapper.ts` — the transformations between models / DTOs / third-party shapes.
  - `logic/<domain>.logic.ts` — parsing, matching, and calculation rules.
  - `utilities/<domain>.util.ts` — shared formatting/normalization helpers.
  - General date handling is app-wide and lives in `src/app/shared/utilities/date.util.ts` (`DateUtil`). Do not create a feature-local `date.util.ts`; extend the shared utility instead
    (see [09-dates-and-localization.md](./09-dates-and-localization.md#central-date-utility)).
- **Extract inline HTML generation from config.** If a config file builds markup with template-literal strings, extract the renderer into a pure function in `logic/` — so the config stays a config.
- Define and export intermediate types for cross-shape mappings instead of `any`.

## What NOT to split

- Don't split for its own sake — every split costs navigation. Split when responsibilities differ, not to hit a size target; if a split makes one concept harder to follow, it is the wrong split.
- Don't create a service with a single method just to "organize" — plain functions cover it.
- Don't split a state service's signals across files; one service per state domain.
- Don't inject a service only to call one pure function — call the pure function directly.
- Don't create micro-folders with a single file (a single `x.mapper.ts` in `mappers/` is fine; `mappers/item/x.mapper.ts` is not).
- Don't move view-only signals into a service when only one component uses them — that just adds indirection.
- Don't put HTTP calls in `logic/` or business rules in HTTP services.

## Suggested refactor order

1. Extract pure logic, mappers and config (zero-risk, no behavior change).
2. Extract form services from dialogs.
3. Extract the largest template sections into child components.
4. Only then split state services — last resort, most invasive.

Verify after each step: `npm run build` (or `npx tsc --noEmit -p tsconfig.app.json`) must stay green.
