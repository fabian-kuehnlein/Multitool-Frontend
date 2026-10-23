# Naming Conventions

Consistent naming is what makes code self-documenting: a well-named symbol
tells the reader what it is, where it belongs, and how it behaves — without
opening the file. These rules apply to **all** TypeScript/SCSS the team writes.

## Overview

| Kind | Case | Example |
| --- | --- | --- |
| Classes (component, service, model, enum, interface) | PascalCase | `ComponentToImplement`, `ServiceExample` |
| Functions, methods, variables, signals | camelCase | `filterItems()`, `selectedItem` |
| Constants & enum members | UPPER_SNAKE_CASE | `DEFAULT_LIMIT`, `CREATE_MODE` |
| Files & folders | kebab-case | `component-to-implement.component.ts` |
| Component selectors | `app-` + kebab-case | `app-component-to-implement` |

The sections below detail each category.

## Classes & components

- Class names are **PascalCase**, broad and declarative — a noun describing what
  the class is (`CalendarEventRow`, `DashboardWidget`), never a verb.
- The class name of a component matches its file and selector (minus the
  `Component` suffix): a file `component-to-implement.component.ts` defines
  `class ComponentToImplement` with selector `app-component-to-implement`.
- Keep the `Component`/`Service`/`Directive`/`Pipe` suffix in the class name so
  the file suffix and class suffix agree (`class ComponentToImplement`).

## Services

- Service classes end in `Service` (state/orchestration) or `HttpService`
  (raw HTTP): `ServiceExample`, `ServiceExampleHttpService`.
- A feature that talks to the backend has exactly two services — the state
  service and the HTTP service. The names differ only by the `Http` segment;
  the file suffixes differ (see [Files & folders](#files--folders)):
  `ServiceExample` (state) and `ServiceExampleHttpService` (HTTP).
- Cross-cutting shared services keep their `Service` suffix too
  (`SharedFeatureService`).

## Directives & pipes

No custom directives or pipes exist yet — when one is added:

- Class names are PascalCase with a `Directive`/`Pipe` suffix
  (`HighlightDirective`, `WeekendLabelPipe`); files use
  `<name>.directive.ts` / `<name>.pipe.ts`.
- Selectors use the same `app-` prefix as components. An **attribute directive**
  uses a camelCase attribute name: `[appHighlight]` (never
  `[app-highlight]`); a pipe selector is camelCase too (`appWeekendLabel`).

## Variables & signals

- Local variables, parameters, and fields are **camelCase**.
- Fields start with a noun/verb phrase that describes their content or purpose
  (`selectedItem`, `totalCount`, `isLoading`). Booleans use a `is`/`has`/`can`
  prefix (`isLoading`, `hasError`, `canSubmit`).
- An injected dependency is a `readonly` camelCase field named after the dashed
  class, lowercased first letter: `private readonly serviceExample =
  inject(ServiceExample);`.
- **Signals:**
  - A mutable (private) signal uses an underscore-prefixed camelCase name:
    `private readonly _items = signal<Item[]>([]);`.
  - Its public read-only view is the same name without the underscore:
    `readonly items = this._items.asReadonly();`.
  - Derived signals use `computed()` and a camelCase name: `readonly visibleItems
    = computed(...)`.
- Avoid single-letter names and meaningless abbreviations; the only exception is
  a trivial loop index.

## Functions & methods

- Names start **either with a verb** (`loadItems()`, `saveChanges()`,
  `formatsValue()`) **or** describe a value directly (`itemLabel()`, `total()`).
- **Event handlers are named for the action they perform**, not for the
  triggering event: `onSave()`, `onSelectionChange()`, `onSubmit()` — never a
  generic `handleClick()`, `handleChange()`. The only accepted `handle*`
  fallback is a keyboard dispatcher (`handleKeydown(event)`) that routes many
  keys to specific, well-named actions.
- **Pure DOM handling without domain meaning** (e.g. `stopPropagation()`) goes
  directly into the template expression — `(click)="$event.stopPropagation()"` —
  instead of being wrapped in a handler that needs an artificial name.
- Booleans returned by a function get an `is`/`has`/`can` prefix
  (`isItemValid()`).
- Factories use `create`/`build` (`buildForm()`), converters use `to`/`from`
  (`toDto()`, `fromResponse()`).
- Pure helper functions in `mappers/` and `logic/` are named for what they
  compute, not where they live: `generalUtilityFunction()`, not
  `someMapperFunctionImpl()`.

## Files & folders

- Files use **kebab-case** and always carry a type suffix so the file alone
  reveals its kind. The generic pattern is `<name>.<type>.ts`:

  | Type | Suffix | Example |
  | --- | --- | --- |
  | Component | `.component.ts` / `.html` / `.scss` | `component-to-implement.component.ts` |
  | State service | `.service.ts` | `service-example.service.ts` |
  | HTTP service | `-http.service.ts` | `service-example-http.service.ts` |
  | Model(s) | `.model.ts` | `item.model.ts` |
  | DTO | `-dto.model.ts` | `create-item-dto.model.ts` |
  | Enum(s) | `.enum.ts` | `status.enum.ts` |
  | Interface / data type | `-type.model.ts` or within `.model.ts` | `item-type.model.ts` |
  | Mapper | `.mapper.ts` | `item.mapper.ts` |
  | Logic | `.logic.ts` | `schedule.logic.ts` |
  | Config / constants | `.config.ts` / `.constants.ts` | `app.config.ts` |
  | Guard | `.guard.ts` | `auth.guard.ts` |
  | Interceptor | `.interceptor.ts` | `auth.interceptor.ts` |
  | Form service | `-form.service.ts` | `item-form.service.ts` |

- Folders are kebab-case and describe their bucket of responsibility
  (`services/`, `mappers/`, `logic/`, `utilities/`, `pages/`, `models/`).
  A feature folder is named after the feature (`feature-example/`).
- Component file triples always keep the same base name and travel together:
  `some-component.component.ts`, `some-component.component.html`,
  `some-component.component.scss`.
- Never pluralize beyond the kind — `models/` is the folder, the file inside is
  `item.model.ts`.
- **Avoid overly generic file names** like `helpers.ts`, `utils.ts`,
  `common.ts`, `misc.ts`. The file name names the *theme* of its contents
  (`date.util.ts`, `priority.logic.ts`); if the code shares no common theme,
  split it into several files instead.
- Unit tests, if/when introduced, live **next to the code under test** (never in
  a separate `tests/` directory) and end in `.spec.ts`
  (`todo.component.spec.ts`). Today no test setup exists — see
  [10-git-and-workflow.md](./10-git-and-workflow.md).

## Enums, interfaces & classes

- **Enums** use PascalCase for the type name and UPPER_SNAKE_CASE for members:
  `enum Priority { LOW, MEDIUM, HIGH }`.
- **Interfaces** use PascalCase and describe a data shape, no `I` prefix:
  `interface ItemRow`, not `IItemRow`. Prefer `interface` for data shapes and
  `type` for unions/aliases.
- **DTOs** are named `Create<Entity>Dto` / `Update<Entity>Dto` /
  `Upsert<Entity>Dto`. An update DTO may extend its create counterpart
  (`UpdateItemDto extends CreateItemDto`).
- **Classes** besides components/services are rare; when used they are
  PascalCase and represent a value/domain concept.

## CSS/SCSS class names

SCSS classes follow the same spirit but use their own scheme (purpose first,
kind last). Full rules live in [08-styling-and-theming.md](./08-styling-and-theming.md#class-naming).

## Example

For a "dashboard" feature, the artifacts line up as:

| Artifact | Name |
| --- | --- |
| Feature folder | `dashboard/` |
| Route page component | class `DashboardComponent`, file `dashboard.component.ts` |
| Selector | `app-dashboard` |
| State service | `DashboardService` / `dashboard.service.ts` |
| HTTP service | `DashboardHttpService` / `dashboard-http.service.ts` |
| Model interface | `DashboardItem` / `dashboard-item.model.ts` |
| Create DTO | `CreateDashboardItemDto` |
| Mapper | `dashboard.mapper.ts` |
