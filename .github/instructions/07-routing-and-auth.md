# Routing & Auth

## Route configuration

All routes live in `src/app/app.routes.ts` and are **lazy-loaded** via `loadComponent`:

```ts
export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
    },
    {
        path: 'login',
        loadComponent: () =>
            import('./core/auth/pages/login/login.component').then(
                (m) => m.LoginComponent,
            ),
    },
    {
        path: 'feature-example',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./modules/feature-example/pages/feature-example.component').then(
                (m) => m.FeatureExampleComponent,
            ),
    },
];
```

Conventions:

- Paths are **kebab-case** and match the feature folder (`feature-example`).
- Root path `''` redirects to `login`.
- Every feature route has `canActivate: [authGuard]`; only the login page is public.
- Use `loadComponent`, never eager component imports or `NgModules`.
- Keep route definitions minimal — the route only maps path → component → guard. Everything else (data loading, permissions) lives in the component/service.

## Guards

- `authGuard` in `core/auth/guards/auth.guard.ts` is a functional `CanActivateFn`:

```ts
export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isLoggedIn()) {
        return true;
    } else {
        router.navigate(['/login']);
        return false;
    }
};
```

- New guards/interceptors are always **functional** (function + `inject()`), not class-based.

## Auth flow

- JWT is stored in `localStorage` under `auth_token` (`AuthService.TOKEN_KEY`).
- `AuthService` (`core/auth/services/auth.service.ts`) keeps the raw JWT in an internal signal and exposes one derived `authState` computed signal (`AuthState`: `isAuthenticated`, `isAdmin`, `userId`, `username`, `mustChangePassword`). Consumers read `authService.authState().isAdmin` etc. Methods: `login()`, `setupCredentials()`, `verifyCredentials()`, `changeCredentials()`, `logout()`, `getToken()`, `isLoggedIn()`.
- JWT claim keys are constants in `core/auth/models/jwt-claims.enum.ts` (`JwtClaims`); do not use string literals like `payload['role']`. Both short and .NET schema claim names are supported.
- `authInterceptor` (`core/auth/interceptors/auth.interceptor.ts`) is a functional `HttpInterceptorFn` that:
  - attaches `Authorization: Bearer <token>` when a token exists,
  - logs the user out when the token is expired or a response returns `401`.
- On login success the app navigates to `/calendar`.
- New users and users whose password was reset by an admin receive `must_change_password = true` in their JWT. `AuthService.authState().mustChangePassword` exposes it.
  - The login page shows a second card ("Zugangsdaten festlegen") instead of navigating; the user sets a new username and password.
  - `PUT /api/Account/credentials/setup` persists the change and returns a fresh JWT (the username claim changes). The login page stores the new token via `AuthService.setupCredentials()`.
  - `authGuard` redirects to `/login` while `mustChangePassword` is set, so the step cannot be bypassed by opening a feature route directly (or after a reload).
- A regular change of the user's own credentials uses `AuthService.changeCredentials()` → `PUT /api/Account/credentials` with `ChangeAccountCredentialsDto` (`currentPassword` plus `newUsername` and/or `newPassword`). It is available in **Einstellungen → Allgemein → Benutzerkonto** (`AccountSettingsComponent`): a settings row opens `AccountSettingsDialogComponent` (`account-settings/account-settings-dialog/`). The dialog has two steps in one dialog — step 1 confirms the current username and password via `AuthService.verifyCredentials()` → `POST /api/Account/credentials/verify` (`VerifyAccountCredentialsDto`, returns `204`), step 2 collects the new data and calls `changeCredentials()`. Both changes require the current password; the endpoint returns a fresh JWT, which the service applies itself. A wrong current password is a `400`, not a `401`, so the auth interceptor does not log the user out.

## Cross-feature navigation

- Navigate between features with `Router.navigate`, passing state via query params (e.g. to `['/other-feature']` with `queryParams: { date }`).
- The target reads the param from `ActivatedRoute.queryParams` and reacts accordingly.
