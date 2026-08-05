import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Standardized hotkeys for all components. */
export const Hotkeys = {
    create: 'alt+e',
    search: 'ctrl+k',
    nextPage: 'alt+arrowright',
    prevPage: 'alt+arrowleft',
    nextModule: 'ctrl+alt+arrowright',
    prevModule: 'ctrl+alt+arrowleft',
} as const;

export type HotkeyCombo = string;

export interface HotkeyBinding {
    /** Unique id, e.g. `'calendar.create'`. */
    id: string;
    /** Combination, e.g. `'alt+n'` or `'ctrl+shift+f'`. */
    combo: HotkeyCombo;
    /** Description for tooltips/docs. */
    description: string;
    action: () => void;
    /** If true, the hotkey also fires while typing in fields. */
    allowInInput?: boolean;
}

interface ParsedCombo {
    key: string;
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class HotkeyService {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly bindings = new Map<string, HotkeyBinding>();
    private readonly parsedComboCache = new Map<string, ParsedCombo>();

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            window.addEventListener('keydown', (event) =>
                this.handleKeydown(event),
            );
        }
    }

    /** Registers a hotkey and returns a cleanup function. */
    register(binding: HotkeyBinding): () => void {
        this.bindings.set(binding.id, binding);

        return () => {
            if (this.bindings.get(binding.id) === binding) {
                this.bindings.delete(binding.id);
            }
        };
    }

    private handleKeydown(event: KeyboardEvent) {
        if (event.defaultPrevented || event.isComposing) return;

        const key = event.key.toLowerCase();

        for (const binding of this.bindings.values()) {
            const combo = this.parseCombo(binding.combo);

            if (event.ctrlKey !== combo.ctrl) continue;
            if (event.altKey !== combo.alt) continue;
            if (event.shiftKey !== combo.shift) continue;
            if (key !== combo.key) continue;
            if (this.isTypingTarget(event.target) && !binding.allowInInput) {
                continue;
            }

            event.preventDefault();
            event.stopPropagation();
            binding.action();
            return;
        }
    }

    private parseCombo(combo: HotkeyCombo): ParsedCombo {
        const cached = this.parsedComboCache.get(combo);
        if (cached) return cached;

        const parts = combo.toLowerCase().split('+');
        const parsed: ParsedCombo = {
            key: '',
            ctrl: false,
            alt: false,
            shift: false,
        };

        for (const part of parts) {
            if (part === 'ctrl' || part === 'control') parsed.ctrl = true;
            else if (part === 'alt') parsed.alt = true;
            else if (part === 'shift') parsed.shift = true;
            else parsed.key = part;
        }

        this.parsedComboCache.set(combo, parsed);
        return parsed;
    }

    private isTypingTarget(target: EventTarget | null): boolean {
        if (!(target instanceof HTMLElement)) return false;
        const tag = target.tagName;
        return (
            tag === 'INPUT' ||
            tag === 'TEXTAREA' ||
            tag === 'SELECT' ||
            target.isContentEditable
        );
    }
}
