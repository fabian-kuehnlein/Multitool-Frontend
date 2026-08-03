# Git & Workflow

## Branching

- `main` is the stable branch; `dev` is the integration branch. PRs target `main` or `dev` and are verified by CI (`.github/workflows/ci.yml`).
- New work happens on feature branches off `dev`.

## Commands

| Task | Command |
| --- | --- |
| Dev server | `npm start` (i.e. `ng serve`, development configuration) |
| Production build | `npm run build` (runs `prebuild` first — see env gotcha) |
| Typecheck | `npm run build` or `npx tsc --noEmit -p tsconfig.app.json` |

- **There is no lint and no test setup.** No `*.spec.ts` files exist, `npm test` fails, and CI does not run tests. Do not invent lint/test commands; typechecking is the verification step.
- CI runs `npm install --legacy-peer-deps` and `npm run build -- --configuration production`. Always use `--legacy-peer-deps` when installing (peer-dependency conflicts otherwise).

## Environment gotcha (high priority)

- `npm run build` triggers `prebuild` → `scripts/set-env.js`, which **overwrites** `src/environments/environment.prod.ts` from the `API_URL` environment variable.
- If `API_URL` is unset, the literal string `'undefined'` is baked into the production bundle.
- `ng serve` does **not** run prebuild; development builds use `environment.development.ts`, which points at the remote integration backend (`https://multitool-api-integration.onrender.com`), not localhost.
- Deploys must set `API_URL` (docker build arg / CI env). The base `environment.ts` is always replaced by `fileReplacements` in both dev and prod configs.

## Commit messages

Commits follow **Conventional Commits** with a scope. Recent history is the reference:

```
<type>(<scope>): <imperative summary, lowercase, no trailing period>
```

Examples from this repo:

```
feat(work-time-planner): add work-time-planner tool
fix(custom-table): prevent unnecessary upsert calls by checking for actual cell changes
refactor(todo, work-time-planner): reorganize scss structure in styling pattern
chore(angular): switch application to zoneless mode
```

Rules:

- **Type**: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `perf`. Match the dominant intent of the change.
- **Scope**: the feature or concern touched — `calendar`, `custom-table`, `todo`, `work-time-planner`, or cross-cutting ones like `ui`, `theme`, `styles`, `responsive`, `core`, `angular`.
- Subject is imperative ("fix ...", "add ..."), all lowercase, no trailing period.
- Multiple scopes are comma-separated (`refactor(todo, work-time-planner)`).
- For merge commits keep the default `Merge pull request #N from ...` message.

## Verification before committing

1. Run the typecheck (`npm run build` or `npx tsc --noEmit -p tsconfig.app.json`) and fix any errors.
2. Review the diff and stage only the intended files — never commit secrets (e.g. a baked `'undefined'` API URL or real tokens).
3. Keep the root `README.md` in sync: if the change affects anything it documents (commands/scripts, build, dev server, deployment, project setup), update the README in the same commit.
4. Commit with a Conventional Commit message as above.
