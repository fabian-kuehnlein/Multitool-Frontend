import {
    ChangeDetectionStrategy,
    Component,
    input,
    output,
} from '@angular/core';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import { TableOverview } from '../../../models';

@Component({
    selector: 'app-table-toolbar',
    standalone: true,
    imports: [UI_MODULES],
    templateUrl: './table-toolbar.component.html',
    styleUrl: './table-toolbar.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class TableToolbarComponent {
    readonly isMobile = input<boolean>(false);
    readonly isTablet = input<boolean>(false);
    readonly isSidebarVisible = input<boolean>(true);
    readonly tableName = input<string | null>(null);
    readonly tableId = input<number>(0);
    readonly tables = input<TableOverview[]>([]);

    readonly openSideNav = output<void>();
    readonly toggleSidebar = output<void>();
    readonly createTable = output<void>();
    readonly editTable = output<void>();
    readonly reorderColumns = output<void>();
    readonly deleteTable = output<void>();
    readonly loadTable = output<number>();
}
