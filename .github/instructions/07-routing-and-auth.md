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
- `AuthService` (`core/auth/services/auth.service.ts`) exposes a public `isAuthenticated` signal and methods `login()`, `logout()`, `getToken()`, `isLoggedIn()`.
- `authInterceptor` (`core/auth/interceptors/auth.interceptor.ts`) is a functional `HttpInterceptorFn` that:
  - attaches `Authorization: Bearer <token>` when a token exists,
  - logs the user out when the token is expired or a response returns `401`.
- On login success the app navigates to `/calendar`.

## Cross-feature navigation

- Navigate between features with `Router.navigate`, passing state via query params (e.g. to `['/other-feature']` with `queryParams: { date }`).
- The target reads the param from `ActivatedRoute.queryParams` and reacts accordingly.
