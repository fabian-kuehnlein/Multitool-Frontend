import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HotkeyService, Hotkeys } from './hotkey.service';

export interface AppModule {
    name: string;
    description: string;
    icon: string;
    route: string;
}

@Injectable({
    providedIn: 'root',
})
export class NavigationService {
    private readonly router = inject(Router);
    private readonly hotkeyService = inject(HotkeyService);

    readonly modules: AppModule[] = [
        {
            name: 'Kalender',
            description: 'Termine verwalten',
            icon: 'calendar_today',
            route: '/calendar',
        },
        {
            name: 'Tabellen',
            description: 'Eigene Listen führen',
            icon: 'table_chart',
            route: '/custom-table',
        },
        {
            name: 'Todos',
            description: 'Aufgaben organisieren',
            icon: 'check_circle',
            route: '/todo',
        },
        {
            name: 'Arbeitszeitplaner',
            description: 'Arbeitszeiten planen & Überstunden verwalten',
            icon: 'schedule',
            route: '/work-time-planner',
        },
    ];

    constructor() {
        this.registerModuleHotkeys();
    }

    private registerModuleHotkeys(): void {
        this.modules.forEach((module, index) => {
            const moduleNumber = index + 1;
            this.hotkeyService.register({
                id: `module.switch.${module.route.slice(1)}`,
                combo: `alt+${moduleNumber}`,
                description: `Zu ${module.name} wechseln`,
                action: () => this.navigateTo(moduleNumber),
            });
        });

        this.hotkeyService.register({
            id: 'module.switch.next',
            combo: Hotkeys.nextModule,
            description: 'Nächstes Modul',
            action: () => this.navigateByOffset(1),
        });
        this.hotkeyService.register({
            id: 'module.switch.previous',
            combo: Hotkeys.prevModule,
            description: 'Vorheriges Modul',
            action: () => this.navigateByOffset(-1),
        });
    }

    navigateTo(moduleNumber: number): void {
        const module = this.modules[moduleNumber - 1];
        if (module) {
            this.router.navigate([module.route]);
        }
    }

    navigateByOffset(offset: number): void {
        const currentIndex = this.getCurrentModuleIndex();
        const nextIndex =
            currentIndex === -1
                ? 0
                : (currentIndex + offset + this.modules.length) %
                  this.modules.length;
        const module = this.modules[nextIndex];
        if (module) {
            this.router.navigate([module.route]);
        }
    }

    private getCurrentModuleIndex(): number {
        const currentUrl = this.router.url.split('?')[0];
        return this.modules.findIndex((module) => module.route === currentUrl);
    }
}
