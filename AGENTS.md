# AGENTS.md

Angular 22 frontend for the Multitool app. Standalone components (no NgModules), zoneless change detection, signals, Angular Material, SCSS, dayjs. All routes are lazy-loaded in `src/app/app.routes.ts`; app bootstrap/config is `src/main.ts` + `src/app/app.config.ts`.

> **Read this first:** the repository conventions live in `.github/instructions/` (README.md is the index). **Before starting any task that writes or changes code, read the relevant instruction files and follow them** — they are the contract for this repo. The summary in [Conventions](#conventions) below is only a quick reminder; the instruction files win when in doubt.

## Commands

- `npm start` — dev server (`ng serve`, development config). No prebuild hook runs.
- `npm run build` — production build. Triggers `prebuild` (`scripts/set-env.js`) first — see env gotcha below.
- Typecheck/verification: `npm run build` or `npx tsc --noEmit -p tsconfig.app.json`.
- No lint or test setup exists. There is no `test` architect target and no `*.spec.ts` files, so `npm test` fails. CI does not run tests either.

## Environment gotcha (high priority)

- `npm run build` runs `scripts/set-env.js`, which **overwrites** `src/environments/environment.prod.ts` from the `API_URL` env var. If `API_URL` is unset, it bakes the literal string `'undefined'` into the production bundle (the current committed file already shows this). Deploys must set `API_URL`, e.g. docker build `--build-arg`/env or CI env.
- `ng serve` does **not** run prebuild; development builds use `environment.development.ts`, which points at the remote integration backend (`https://multitool-api-integration.onrender.com`), not localhost.
- `environment.ts` (base) points at `http://localhost:5100` but is always replaced by a file replacement in both dev and prod configs.
- API base for every service is `${environment.MultitoolApi}/api/<Controller>`.

## Architecture

- `src/app/core/` — auth (login page, guard, JWT interceptor), layout, services, date (dayjs Material DateAdapter).
- `src/app/modules/` — one folder per feature: `calendar`, `custom-table`, `todo`, `work-time-planner`. Each feature splits HTTP from logic: `<feature>-http.service.ts` (raw HttpClient) + `<feature>.service.ts` (signals/state). Models live under `models/` with `dtos/`/`enums`/`metadata`/`ui` subfolders; `models/index.ts` barrel exports exist.
- `src/app/shared/` — shared components, models, services, utilities.
- Auth: JWT stored in `localStorage` under `auth_token`; `AuthService` checks `exp` locally; `auth.interceptor.ts` auto-logs-out on 401 or expired token.

## Conventions

- **Single source of truth:** `.github/instructions/` (README.md is the index) — read the relevant file(s) before writing or changing code. The bullets below are only a quick reminder.
- Keep the root `README.md` in sync: when a change affects what it documents (commands/scripts, build, dev server, deployment, project setup), update it in the same commit.
- German UI: `de` locale, dayjs `DD.MM.YYYY` / `HH:mm` formats, German MatPaginator labels. Keep new UI text German.
- Strict TS (`strict`, `noImplicitOverride`, `strictTemplates`, `isolatedModules`). 4-space indent, single quotes, 4-space indent per `.editorconfig`.
- Angular Material theming lives in SCSS partials at `src/` root (`_theme.scss`, `_css-variables.scss`, `_material-palettes.scss`, `_breakpoints.scss`); component styles are SCSS.
- Keep TypeScript files small and single-purpose: pure logic → feature `logic/`, mappings → feature `mappers/`, config/constants → feature `utilities/`, dialog forms → `<name>-form.service.ts` next to the dialog (see `10-code-splitting.md`).

## Deploy

- `dockerfile`: builds with Node 22 alpine, `npm install --legacy-peer-deps` (required — peer dep conflicts), then serves `dist/multitool-frontend/browser/` via nginx.
- CI (`.github/workflows/ci.yml`): Node 22, `npm install --legacy-peer-deps`, `npm run build -- --configuration production` on main/dev pushes and PRs. Does not set `API_URL` today.
