import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly STORAGE_KEY = 'multitool-theme';

    readonly isDark = signal(false);

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved === 'dark') {
                this.isDark.set(true);
                document.documentElement.setAttribute('data-theme', 'dark');
            } else if (saved === 'light') {
                this.isDark.set(false);
                document.documentElement.removeAttribute('data-theme');
            } else {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                this.isDark.set(prefersDark);
                if (prefersDark) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                }
            }
        }

        effect(() => {
            if (isPlatformBrowser(this.platformId)) {
                const dark = this.isDark();
                if (dark) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    localStorage.setItem(this.STORAGE_KEY, 'dark');
                } else {
                    document.documentElement.removeAttribute('data-theme');
                    localStorage.setItem(this.STORAGE_KEY, 'light');
                }
            }
        });
    }

    toggle(): void {
        this.isDark.update(v => !v);
    }
}
