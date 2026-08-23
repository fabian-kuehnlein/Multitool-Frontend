import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    inject,
    effect,
} from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { NavigationService } from './core/services/navigation.service';
import { AuthService } from './core/auth/services/auth.service';
import { CategoryService } from './shared/services/category.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet],
    templateUrl: './app.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
    private readonly matIconReg = inject(MatIconRegistry);

    /** Root‑level service initialization for global application behavior */
    
    // ensures global theme handling
    private readonly themeService = inject(ThemeService);
    // registers app‑wide hotkeys
    private readonly navigationService = inject(NavigationService);
    // loads and maintains global category state
    private readonly categoryService = inject(CategoryService);
    // auth state, triggers the initial category load
    private readonly authService = inject(AuthService);

    constructor() {
        // loads categories as soon as a valid session exists
        // (immediately on app start when already logged in, otherwise after login)
        effect(() => {
            if (this.authService.isAuthenticated()) {
                this.categoryService.loadCategories();
            }
        });
    }

    /** */

    ngOnInit(): void {
        this.matIconReg.setDefaultFontSetClass('material-symbols-outlined');
    }
}
