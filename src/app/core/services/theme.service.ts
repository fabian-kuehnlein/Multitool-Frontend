import { Injectable, signal, effect, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly STORAGE_KEY = 'multitool-theme';

    readonly mode = signal<ThemeMode>('system');
    private readonly prefersDark = signal(false);

    readonly resolvedMode = computed<ResolvedTheme>(() => {
        const currentMode = this.mode();
        if (currentMode === 'system') {
            return this.prefersDark() ? 'dark' : 'light';
        }
        return currentMode;
    });

    private mediaQuery: MediaQueryList | null = null;
    private mediaQueryListener: ((event: MediaQueryListEvent) => void) | null = null;

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            const saved = localStorage.getItem(this.STORAGE_KEY) as ThemeMode | null;
            if (saved !== null) {
                this.mode.set(saved);
            } else {
                this.mode.set('system');
            }

            this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            this.prefersDark.set(this.mediaQuery.matches);

            this.mediaQueryListener = (event: MediaQueryListEvent) => {
                this.prefersDark.set(event.matches);
            };
            this.mediaQuery.addEventListener('change', this.mediaQueryListener);

            this.applyTheme();
        }

        effect(() => {
            if (!isPlatformBrowser(this.platformId)) return;

            const currentMode = this.mode();
            localStorage.setItem(this.STORAGE_KEY, currentMode);
            this.applyTheme();
        });

        effect(() => {
            if (!isPlatformBrowser(this.platformId)) return;

            this.resolvedMode();
            this.applyTheme();
        });
    }

    setMode(mode: ThemeMode): void {
        if (this.mode() === mode) return;

        this.mode.set(mode);
    }

    private applyTheme(): void {
        if (this.resolvedMode() === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }
}
