# HTTP & Models

## HTTP services

`src/app/modules/<feature>/services/<feature>-http.service.ts` is a thin `HttpClient` wrapper:

```ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Todo, CreateTodoDto, UpdateTodoDto } from '../models/todo.model';

@Injectable({ providedIn: 'root' })
export class TodoHttpService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.MultitoolApi}/api/Todo`;

    getTodos(): Observable<Todo[]> {
        return this.http.get<Todo[]>(this.apiUrl);
    }
}
```

Conventions:

- Base URL is always `` `${environment.MultitoolApi}/api/<Controller>` `` — never hard-code hosts. The environment is swapped per build (`environment.development.ts` for dev, `environment.prod.ts` for prod).
- Name the property `apiUrl` or `apiURL` consistently within a file; controller name is PascalCase after `/api/` (`/api/CustomTable`, `/api/WorkTimePlanner`).
- Every method returns a typed `Observable<T>`; the service layer (`<feature>.service.ts`) subscribes.
- Use `HttpParams` for query parameters, `HttpClient` generic overloads for the response type, and explicit `{ headers }` when a body must be sent as raw JSON (see `upsertCell` in `custom-table-http.service.ts`).
- No state, no `tap`/`map` business logic in the HTTP service — return the raw request.

## Models

- Model files are named `<name>.model.ts` and may export interfaces, enums and type aliases together (see `todo.model.ts`, `work-time-planner.model.ts`).
- Naming:
  - Resource shape: `Todo`, `CalendarEvent`, `WorkDay`.
  - Request payloads: `CreateTodoDto`, `UpdateTodoDto`, `UpsertTableDto`. `CreateXDto`/`UpdateXDto` may extend the create shape (`UpdateTodoDto extends CreateTodoDto`).
  - Enums: `Priority`, `DayStatus`, `CustomDataType`.
- Be explicit about nullability: `description?: string | null;` — mark optional fields with `?` and nullable fields with `| null`.
- Strings are the currency for dates and times (see [08-dates-and-localization.md](./08-dates-and-localization.md)).

### Models folder layout (larger features)

For features with many models (see `custom-table/models/`), split into subfolders and re-export through a barrel:

```
models/
├── index.ts
├── dtos/        # create-/update-/upsert payloads
├── enums/       # enum types
├── metadata/    # table metadata, column/row info
└── ui/          # view models (table overview)
```

`models/index.ts` re-exports everything:

```ts
export * from './ui/table-overview.model';
export * from './metadata/table-detail.model';
export * from './dtos/create-column-dto.model';
// ...
```

Services then import from the barrel: `import { UpsertTableDto, TableDetail } from '../models';`.

Small features may keep a single `todo.model.ts` instead of a barrel.

## Shared models

- Truly cross-cutting models live in `shared/models/` (e.g. `category.model.ts`). Feature-specific models stay in the feature.
- Shared HTTP resources follow the same `-http.service.ts` / `.service.ts` split under `shared/services/` (`category-http.service.ts`, `category.service.ts`).

## Backend contract

- Controllers are pluralized resources (`/api/Todo`, `/api/Calendar`, `/api/CustomTable`); endpoints are appended with kebab-case segments (`/events/search`, `/tables/${tableId}/rows`).
- If the backend route changes, update the HTTP service only — components stay untouched.
