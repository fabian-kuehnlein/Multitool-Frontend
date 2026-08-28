# HTTP & Models

## HTTP services

`src/app/modules/<feature>/services/<feature>-http.service.ts` is a thin `HttpClient` wrapper:

```ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ItemModel, CreateItemDto, UpdateItemDto } from '../models/item.model';

@Injectable({ providedIn: 'root' })
export class ServiceExampleHttpService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.MultitoolApi}/api/ControllerName`;

    getItems(): Observable<ItemModel[]> {
        return this.http.get<ItemModel[]>(this.apiUrl);
    }
}
```

Conventions:

- Base URL is always `` `${environment.MultitoolApi}/api/<Controller>` `` — never hard-code hosts. The environment is swapped per build (`environment.development.ts` for dev, `environment.prod.ts` for prod).
- Name the property `apiUrl` consistently within a file; controller name is PascalCase after `/api/` (`/api/ControllerName`).
- Every method returns a typed `Observable<T>`; the service layer (`<feature>.service.ts`) subscribes.
- Use `HttpParams` for query parameters, `HttpClient` generic overloads for the response type, and explicit `{ headers }` when a body must be sent as raw JSON.
- No state, no `tap`/`map` business logic in the HTTP service — return the raw request.

## Models

- Model files are named `<name>.model.ts` and may export interfaces, enums and type aliases together.
- Naming (see [02-naming-conventions.md](./02-naming-conventions.md)):
  - Resource shape: `ItemModel`, `DetailItem`.
  - Request payloads: `CreateItemDto`, `UpdateItemDto`, `UpsertItemDto`. `CreateXDto`/`UpdateXDto` may extend the create shape (`UpdateItemDto extends CreateItemDto`).
  - Enums: `ItemStatus`, `ItemType`.
- Be explicit about nullability: `description?: string | null;` — mark optional fields with `?` and nullable fields with `| null`.
- Strings are the currency for dates and times (see [09-dates-and-localization.md](./09-dates-and-localization.md)).

### Models folder layout (larger features)

For features with many models, split into subfolders and re-export through a barrel:

```
models/
├── index.ts
├── dtos/        # create-/update-/upsert payloads
├── enums/       # enum types
├── metadata/    # table metadata, column/row info
└── ui/          # view models
```

`models/index.ts` re-exports everything:

```ts
export * from './ui/item-overview.model';
export * from './metadata/item-detail.model';
export * from './dtos/create-item-dto.model';
// ...
```

Services then import from the barrel: `import { UpsertItemDto, ItemDetail } from '../models';`.

Small features may keep a single `item.model.ts` instead of a barrel.

## Shared models

- Truly cross-cutting models live in `shared/models/`. Feature-specific models stay in the feature.
- Shared HTTP resources follow the same `-http.service.ts` / `.service.ts` split under `shared/services/`.

## Backend contract

- Controllers are pluralized resources (`/api/ControllerName`); endpoints are appended with kebab-case segments (`/items/search`, `/items/${itemId}/details`).
- If the backend route changes, update the HTTP service only — components stay untouched.
