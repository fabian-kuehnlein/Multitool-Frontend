import { Injectable, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { computed, signal } from '@angular/core';
import { map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MediaService {
    private readonly breakpointObserver = inject(BreakpointObserver);

    readonly isMobile = toSignal(
        this.breakpointObserver
            .observe(['(max-width: 600px)'])
            .pipe(map((result) => result.matches)),
        { initialValue: false },
    );

    readonly isTablet = toSignal(
        this.breakpointObserver
            .observe(['(min-width: 601px) and (max-width: 1024px)'])
            .pipe(map((result) => result.matches)),
        { initialValue: false },
    );

    readonly isLaptop = toSignal(
        this.breakpointObserver
            .observe(['(min-width: 1025px) and (max-width: 1640px)'])
            .pipe(map((result) => result.matches)),
        { initialValue: false },
    );

    readonly isDesktop = computed(
        () => !this.isMobile() && !this.isTablet() && !this.isLaptop(),
    );
}
