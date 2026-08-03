# Multitool Frontend

Angular 22 frontend for the Multitool app — a collection of workday tools: **Calendar** (events, recurring events, holidays), **Custom Table** (free-form editable tables), **Todo** (task list) and **Work Time Planner** (weekly time tracking).

## Tech stack

- Angular 22 with **standalone components** (no NgModules), **zoneless** change detection, **signals**
- Angular Material + CDK
- SCSS with CSS-variable theming (light/dark mode)
- dayjs for all date handling (`de` locale, `DD.MM.YYYY` / `HH:mm`)
- FullCalendar for the calendar feature
- RxJS, TypeScript ~6.0 (strict)

## Prerequisites

- Node.js 22 (matches the Docker build and CI)
- npm

> Install with `--legacy-peer-deps` — the dependency set has peer-dep conflicts otherwise:
> `npm install --legacy-peer-deps`

## Development server

```bash
npm start
```

Runs `ng serve` with the development configuration. Navigate to `http://localhost:4200/`. The app reloads automatically on file changes.

> `ng serve` does **not** run the prebuild hook. The development build uses `src/environments/environment.development.ts`, which points at the remote integration backend (`https://multitool-api-integration.onrender.com`) — not localhost.

## Production build

```bash
npm run build
```

Builds with the production configuration into `dist/multitool-frontend/`.

> `npm run build` first runs the `prebuild` hook (`scripts/set-env.js`), which **overwrites** `src/environments/environment.prod.ts` from the `API_URL` environment variable. If `API_URL` is unset, the literal string `'undefined'` is baked into the bundle. Deploys must set `API_URL` (Docker build arg / CI env).

## Available scripts

| Command | Description |
| --- | --- |
| `npm start` | Dev server (`ng serve`, development config) |
| `npm run build` | Production build (runs `prebuild` first, see above) |
| `npm run watch` | `ng build --watch` with the development config |
| `npm test` | No test setup — this target is not configured and fails |

There is no lint or test setup. The typecheck can be run via `npm run build` or `npx tsc --noEmit -p tsconfig.app.json`.

## Project structure

```
src/
├── main.ts                  # app bootstrap
├── app/
│   ├── app.config.ts        # root providers (zoneless, routes, locale, Material)
│   ├── app.routes.ts        # all routes, lazy-loaded
│   ├── core/                # auth (login, guard, JWT interceptor), layout, global services
│   ├── modules/             # one folder per feature: calendar, custom-table, todo, work-time-planner
│   │   └── <feature>/       # models/, mappers/, logic/, utilities/, pages/, services/
│   └── shared/              # reusable components, models, services, utilities
└── environments/            # environment.ts (base) + dev/prod variants
```

## Features

- **Calendar** — month/week/day views, recurring events (RRule), holidays, todo events shown inline, mobile list view, dark mode.
- **Custom Table** — create tables, add/edit/delete columns and rows, inline cell editing with type validation, drag & drop reordering.
- **Todo** — task list with priorities, categories, due dates, filtering/sorting, mobile-optimized dialog.
- **Work Time Planner** — weekly time tracking with break rules, overtime, home-office counting and week summaries.

## Auth

JWT-based login. The token is stored in `localStorage` under `auth_token`; `AuthService` validates the `exp` claim locally and `auth.interceptor.ts` attaches `Authorization: Bearer <token>` and auto-logs-out on `401` or an expired token.

## Deployment

- **Docker** (`dockerfile`): multi-stage build — Node 22 alpine installs with `npm install --legacy-peer-deps`, builds the app, then nginx serves `dist/multitool-frontend/browser/`.
- **CI** (`.github/workflows/ci.yml`): Node 22, `npm install --legacy-peer-deps`, `npm run build -- --configuration production` on pushes/PRs to `main` and `dev`. Currently does not set `API_URL`.

## Conventions

Repository conventions (Angular patterns, file structure, code splitting, styling, git) live in [`.github/instructions/`](.github/instructions/README.md). Read them before changing code.
