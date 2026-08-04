import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    OnDestroy,
    computed,
    inject,
    signal,
} from '@angular/core';
import {
    CdkDragDrop,
    DragDropModule,
    moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { FormControl } from '@angular/forms';
import { UI_MODULES } from '../../../shared/utilities/material-ui';
import { SidenavComponent } from '../../../core/layout/sidenav/sidenav.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MediaService } from '../../../core/services/media.service';
import { HotkeyService, Hotkeys } from '../../../core/services/hotkey.service';
import { CustomTableService } from '../services/custom-table.service';
import {
    CustomDataType,
    RowInfo,
    UpdateColumnDto,
    UpdateColumnOrderDto,
    UpdateRowOrderDto,
    UpsertTableDto,
} from '../models';
import { DialogMode } from '../utilities/custom-table.config';
import {
    TableConfigDialog,
    TableConfigDialogData,
} from './components/table-config-dialog/table-config-dialog.component';
import {
    ReorderableColumn,
    ReorderColumnsDialogComponent,
} from './components/reorder-columns-dialog/reorder-columns-dialog.component';
import { TableToolbarComponent } from './components/table-toolbar/table-toolbar.component';
import { TableSidebarComponent } from './components/table-sidebar/table-sidebar.component';
import { TableCellEditorComponent } from './components/table-cell-editor/table-cell-editor.component';

@Component({
    selector: 'app-custom-table',
    standalone: true,
    imports: [
        CommonModule,
        UI_MODULES,
        MatTableModule,
        DragDropModule,
        TableToolbarComponent,
        TableSidebarComponent,
        TableCellEditorComponent,
    ],
    templateUrl: './custom-table.component.html',
    styleUrl: './custom-table.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class CustomTableComponent implements OnInit, OnDestroy {
    protected readonly CustomDataType = CustomDataType;

    private readonly dialog = inject(MatDialog);
    protected readonly tableService = inject(CustomTableService);
    private readonly media = inject(MediaService);
    private readonly hotkeyService = inject(HotkeyService);
    private readonly hotkeyUnsubscribers: Array<() => void> = [];

    readonly isMobile = this.media.isMobile;
    readonly isTablet = this.media.isTablet;

    // UI State Signals
    protected readonly removeRowsColumn = signal<boolean>(false);
    protected readonly isSidebarVisible = signal<boolean>(true);
    protected readonly isFabMenuOpen = signal<boolean>(false);

    // Derived Signals
    protected readonly stringColumnCount = computed(
        () =>
            this.tableService
                .columns()
                .filter((col) => col.dataType === CustomDataType.String).length,
    );

    protected readonly stringColumnWidth = computed(
        () => 100 / Math.max(this.stringColumnCount(), 1) + '%',
    );

    protected readonly displayedColumns = computed(() => {
        const baseColumns = this.tableService
            .columns()
            .map((col) => col.columnId.toString());
        if (this.removeRowsColumn()) {
            return ['delete', ...baseColumns];
        }
        return ['drag', ...baseColumns];
    });

    private readonly removeControlsCache = new Map<number, FormControl>();

    protected readonly removeControls = computed(() => {
        const record: Record<number, FormControl> = {};
        for (const row of this.tableService.rows()) {
            let control = this.removeControlsCache.get(row.rowId);
            if (!control) {
                control = new FormControl(false);
                this.removeControlsCache.set(row.rowId, control);
            }
            record[row.rowId] = control;
        }
        return record;
    });

    ngOnInit(): void {
        this.tableService.fetchTableList();
        this.hotkeyUnsubscribers.push(
            this.hotkeyService.register({
                id: 'custom-table.create',
                combo: Hotkeys.create,
                description: 'Neue Tabelle erstellen',
                action: () => this.createTable(),
            }),
        );
    }

    ngOnDestroy(): void {
        this.hotkeyUnsubscribers.forEach((unsubscribe) => unsubscribe());
    }

    openSideNav(): void {
        this.dialog.open(SidenavComponent, {
            position: this.isMobile()
                ? { bottom: '120px' }
                : { top: '90px', left: '30px' },
            width: this.isMobile() ? '90vw' : 'auto',
            height: 'auto',
            hasBackdrop: true,
            backdropClass: 'transparent-backdrop',
            data: 'custom-table',
        });
    }

    loadTable(tableId: number): void {
        this.tableService.loadTable(tableId);
    }

    toggleSidebar(): void {
        this.isSidebarVisible.update((visible) => !visible);
    }

    createTable(): void {
        this.openTableConfigDialog({ dialogMode: DialogMode.CreateTable })
            .afterClosed()
            .subscribe((data: UpsertTableDto | null) => {
                if (data) {
                    this.tableService.createTable(data);
                }
            });
    }

    editTable(): void {
        const tableId = this.tableService.tableId();
        const currentTable = this.tableService.currentTable();
        if (tableId === 0 || !currentTable) return;

        this.openTableConfigDialog({
            dialogMode: DialogMode.EditTable,
            tableName: currentTable.name,
        })
            .afterClosed()
            .subscribe((data: string | null) => {
                if (data) {
                    this.tableService.updateTable(tableId, data);
                }
            });
    }

    deleteTable(): void {
        const tableId = this.tableService.tableId();
        if (tableId === 0) return;

        this.dialog
            .open(ConfirmDialogComponent, {
                data: {
                    title: 'Tabelle löschen',
                    message:
                        'Möchtest du diese Tabelle wirklich mit allen Inhalten löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.',
                    confirmText: 'Tabelle löschen',
                    isDestructive: true,
                },
            })
            .afterClosed()
            .subscribe((result) => {
                if (!result) return;
                this.tableService.deleteTable(tableId);
            });
    }

    addColumn(): void {
        this.tableService.createColumn(this.tableService.tableId());
    }

    deleteColumn(event: MouseEvent, colId: number): void {
        event.stopPropagation();

        this.dialog
            .open(ConfirmDialogComponent, {
                data: {
                    title: 'Spalte löschen',
                    message:
                        'Möchtest du diese Spalte wirklich löschen? Alle darin enthaltenen Daten gehen unwiderruflich verloren.',
                    confirmText: 'Spalte löschen',
                    isDestructive: true,
                },
            })
            .afterClosed()
            .subscribe((result) => {
                if (!result) return;
                this.tableService.deleteColumn(
                    this.tableService.tableId(),
                    colId,
                );
            });
    }

    editColumn(colId: number): void {
        const col = this.tableService
            .columns()
            .find((c) => c.columnId === colId);
        if (!col) return;

        const hasValues = this.tableService.rows().some((row) => {
            const value = row.cells[colId];
            return value !== null && value !== undefined && value !== '';
        });

        this.openTableConfigDialog({
            dialogMode: DialogMode.EditColumn,
            col,
            hasValues,
        })
            .afterClosed()
            .subscribe((data: UpdateColumnDto | true | null) => {
                if (data === true) {
                    this.tableService.deleteColumn(
                        this.tableService.tableId(),
                        colId,
                    );
                } else if (data) {
                    this.tableService.updateColumn(colId, data);
                }
            });
    }

    reorderColumns(): void {
        const cols: ReorderableColumn[] = this.tableService
            .columns()
            .map((col) => ({
                id: col.columnId,
                name: col.name,
                order: col.colOrder,
            }));

        this.dialog
            .open(ReorderColumnsDialogComponent, {
                width: this.isMobile() ? '100vw' : 'auto',
                height: this.isMobile() ? '100vh' : 'auto',
                minWidth: this.isMobile() ? '100vw' : '500px',
                maxWidth: this.isMobile() ? '100vw' : '1500px',
                panelClass: this.isMobile() ? 'full-screen-dialog' : '',
                data: { columns: cols },
            })
            .afterClosed()
            .subscribe((result: UpdateColumnOrderDto[] | null) => {
                if (!result) return;
                this.tableService.updateColumnOrder(result);
            });
    }

    addRow(): void {
        this.tableService.createRow(this.tableService.tableId());
    }

    dropRow(event: CdkDragDrop<RowInfo[]>): void {
        if (event.previousIndex === event.currentIndex) return;

        const rows = [...this.tableService.rows()];
        moveItemInArray(rows, event.previousIndex, event.currentIndex);

        const updateDtos: UpdateRowOrderDto[] = rows.map((row, index) => ({
            rowId: row.rowId,
            rowOrder: index,
        }));

        this.tableService.updateRowOrder(updateDtos);
    }

    toggleRemoveMode(): void {
        this.removeRowsColumn.update((value) => !value);
        if (!this.removeRowsColumn()) {
            Object.values(this.removeControls()).forEach((control) =>
                control.setValue(false),
            );
        }
    }

    hasCheckedRows(): boolean {
        return Object.values(this.removeControls()).some(
            (control) => control.value,
        );
    }

    deleteRows(): void {
        const rows = Object.entries(this.removeControls())
            .filter(([_, control]) => control.value)
            .map(([rowId]) => Number(rowId));

        if (rows.length === 0) return;

        this.dialog
            .open(ConfirmDialogComponent, {
                data: {
                    title: 'Zeilen löschen',
                    message:
                        'Möchtest du die ausgewählten Zeilen wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.',
                    confirmText: 'Zeilen löschen',
                    isDestructive: true,
                },
            })
            .afterClosed()
            .subscribe((result) => {
                if (!result) return;
                this.tableService.deleteRows(this.tableService.tableId(), rows);
                this.toggleRemoveMode();
            });
    }

    toggleFabMenu(): void {
        this.isFabMenuOpen.update((value) => !value);
    }

    focusOwnCell(event: MouseEvent): void {
        const cell = event.currentTarget as HTMLElement;
        const input = cell.querySelector<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >('input, textarea, select, [tabindex]:not([tabindex="-1"])');
        if (input) {
            input.focus();
        }
    }

    private openTableConfigDialog(
        data: TableConfigDialogData,
    ): MatDialogRef<TableConfigDialog> {
        return this.dialog.open(TableConfigDialog, {
            width: this.isMobile() ? '100vw' : 'auto',
            height: this.isMobile() ? '100vh' : 'auto',
            minWidth: this.isMobile() ? '100vw' : '600px',
            maxWidth: this.isMobile() ? '100vw' : '1500px',
            panelClass: this.isMobile() ? 'full-screen-dialog' : '',
            data,
        });
    }
}
