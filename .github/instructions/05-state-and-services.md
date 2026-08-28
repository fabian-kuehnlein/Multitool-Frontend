# State & Services

## Two-service split per feature

Every feature that talks to the backend has **exactly two services**:

1. `<feature>-http.service.ts` — thin wrapper around `HttpClient`. Knows URLs, params, and typed return types. Contains **no state, no logic** (see [06-http-and-models.md](./06-http-and-models.md)).
2. `<feature>.service.ts` — holds all signals/state and orchestrates calls. The components interact only with this service.

Components never touch the HTTP service directly and never hold server state themselves.

## State service pattern

```ts
@Injectable({ providedIn: 'root' })
export class ServiceExample {
    private readonly httpService = inject(ServiceExampleHttpService);

    // Private state signals
    private readonly _items = signal<ItemModel[]>([]);
    private readonly _loading = signal<boolean>(false);

    // Public read-only signals
    readonly items = this._items.asReadonly();
    readonly loading = this._loading.asReadonly();

    // Derived signals
    readonly visibleItems = computed(() =>
        this._items().filter((item) => item.isVisible),
    );
    readonly stats = computed(() => { /* ... */ });

    loadItems(): void { /* http call updates _items */ }
}
```

Conventions:

- State lives in **private** signals with an underscore prefix (`_items`).
- Expose them read-only via `.asReadonly()` without the underscore.
- Derived values are `computed()` signals, never plain fields.
- A `_loading` signal + `loading` readonly drives spinners/loading overlays in templates.
- Mutation is always immutable: `set`, `update` with a new array/object, never `.push()` on a signal-held array.
- Mark `@Injectable({ providedIn: 'root' })` unless the service genuinely needs per-instance scope (then provide it in a component `providers` array).

## Triggering loads

- Components call plain methods like `loadItems()`, `updateItem(id, dto)`, `toggleItem(id)`.
- The service subscribes internally and updates its signals on `next`/`error`. Keep the `finalize(() => this._loading.set(false))` or explicit `next`+`error` reset of the loading flag.
- On `error`, reset loading and (where sensible) show a message via `SnackbarService` or leave state untouched.

## Where logic lives

- **Feature service**: state, data fetching, and orchestration. It must stay under ~300 lines — once it grows, pure business rules move out to `logic/`.
- **Component**: view/UI orchestration only — sorting a list for display, opening dialogs, formatting for the template.
- **HTTP service**: no business logic.
- Pure logic goes to `logic/`, data transformations to `mappers/`, config/constants to `utilities/` (see [11-code-splitting.md](./11-code-splitting.md)).

## Derived state lives in the service

- Compute derived signals in the feature service via `computed()` — **once**. Components consume them; they do not re-derive the same values.
- If a component needs extra derived state that other components could need too, move it into the service rather than duplicating it.

## Caching

- Cheap caches are fine inside the state service (e.g. `lookupCache = new Map<string, ItemModel[]>()`).
- Prefer signals as the single source of truth; a `Map` cache is acceptable for keyed GET results that are re-fetched rarely.

## Cross-cutting shared state

- Global services used by multiple features live in `core/services/` or `shared/services/`.
- Never duplicate state that a shared service already provides (e.g. categories, breakpoint flags).
