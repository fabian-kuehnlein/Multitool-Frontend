import { Component, ElementRef, inject, OnInit, QueryList, ViewChild, ViewChildren, signal, computed, effect, AfterViewInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { UI_MODULES } from '../../../shared/utilities/material-ui';
import { MatDialog } from '@angular/material/dialog';
import { SidenavComponent } from '../../../core/layout/sidenav/sidenav.component';
import { MatCardModule } from '@angular/material/card';
import { ColumnInfo, CustomDataType, RowInfo, UpdateRowOrderDto } from '../models';
import { MatListModule } from '@angular/material/list';
import { CustomTableService } from '../services/custom-table.service';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { TableConfigDialog } from './components/table-config-dialog/table-config-dialog';
import { FormControl, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ReorderColumnsDialogComponent } from './components/reorder-columns-dialog/reorder-columns-dialog.component';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-custom-table',
  imports: [
    UI_MODULES,
    MatCardModule,
    MatListModule,
    MatTableModule,
    MatCheckboxModule,
    MatDatepickerModule,
    DragDropModule
  ],
  templateUrl: './custom-table.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './custom-table.component.scss'
})
export class CustomTableComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatTable) table!: MatTable<any>;
    @ViewChild('sidebarList', { read: ElementRef }) sidebarList?: ElementRef;
    @ViewChildren('cellInput') cellInputs!: QueryList<ElementRef<HTMLInputElement>>;

    private readonly dialog = inject(MatDialog);
    protected readonly tableService = inject(CustomTableService)
    private readonly snackbarService = inject(SnackbarService)
    private readonly breakpointObserver = inject(BreakpointObserver);

    // UI State Signals
    protected readonly removeRowsColumn = signal<boolean>(false);
    protected readonly isSidebarVisible = signal<boolean>(true);
    protected readonly isFabMenuOpen = signal<boolean>(false);

    public readonly isMobile = toSignal(
        this.breakpointObserver.observe(['(max-width: 849.98px)']).pipe(
            map(result => result.matches)
        ),
        { initialValue: false }
    );

    public readonly isTablet = toSignal(
        this.breakpointObserver.observe(['(min-width: 850px) and (max-width: 1399.98px)']).pipe(
            map(result => result.matches)
        ),
        { initialValue: false }
    );

    // Pagination Signals
    protected readonly pageSize = signal<number>(10);
    protected readonly pageIndex = signal<number>(0);
    private resizeObserver?: ResizeObserver;

    toggleSidebar() {
        this.isSidebarVisible.update(v => !v);
    }
    
    // Computed Signals
    protected readonly displayedColumns = computed(() => {
        const baseColumns = this.tableService.columns().map(col => col.columnId.toString());
        if (this.removeRowsColumn()) {
            return ['delete', ...baseColumns];
        }
        return ['drag', ...baseColumns];
    });

    protected readonly paginatedTableList = computed(() => {
        const list = this.tableService.tableList();
        const start = this.pageIndex() * this.pageSize();
        return list.slice(start, start + this.pageSize());
    });

    onPageChange(event: PageEvent) {
        this.pageIndex.set(event.pageIndex);
        this.pageSize.set(event.pageSize);
    }

    public formControls: { [key: string]: FormControl } = {};
    public removeControls: { [rowId: number]: FormControl} = {};
    public dataSource = new MatTableDataSource<RowInfo>();

    constructor() {
        // Automatically sync dataSource and formControls when table data changes
        effect(() => {
            const rows = this.tableService.rows();
            const cols = this.tableService.columns();
            
            this.dataSource.data = rows;
            this.initializeFormControls(rows, cols);
            
            if (this.table) {
                this.table.renderRows();
            }
        });

        // Ensure pageIndex is valid when table list changes
        effect(() => {
            const list = this.tableService.tableList();
            const maxPage = Math.max(0, Math.ceil(list.length / this.pageSize()) - 1);
            if (this.pageIndex() > maxPage) {
                this.pageIndex.set(maxPage);
            }
        });
    }

    ngOnInit(): void {
        this.tableService.fetchTableList();
    }

    ngAfterViewInit(): void {
        this.setupResizeObserver();
    }

    ngOnDestroy(): void {
        this.resizeObserver?.disconnect();
    }

    private setupResizeObserver() {
        if (!this.sidebarList?.nativeElement) return;

        this.resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                if (this.sidebarList && entry.target === this.sidebarList.nativeElement) {
                    this.calculatePageSize();
                }
            }
        });

        this.resizeObserver.observe(this.sidebarList.nativeElement);
        this.calculatePageSize();
    }

    private calculatePageSize() {
        if (!this.sidebarList?.nativeElement) return;
        
        const containerHeight = this.sidebarList.nativeElement.clientHeight;
        const itemHeight = 56; // 48px standard + 8px gap
        
        const newPageSize = Math.max(1, Math.floor(containerHeight / itemHeight));
        if (newPageSize !== this.pageSize()) {
            this.pageSize.set(newPageSize);
        }
    }

    private initializeFormControls(rows: RowInfo[], columns: ColumnInfo[]) {
        this.formControls = {};
        
        for (const row of rows) {
            for (const col of columns) {
                const key = `${row.rowId}_${col.columnId}`;
                const value = row.cells[col.columnId];
                
                let validators = [];
                if (col.dataType === CustomDataType.Int) {
                    validators.push(Validators.pattern(/^\d+$/));
                } else if (col.dataType === CustomDataType.Decimal) {
                    validators.push(Validators.pattern(/^\d+(\.\d{1,2})?$/));
                }

                this.formControls[key] = new FormControl(value ?? '', validators);
            }

            if (!this.removeControls[row.rowId]) {
                this.removeControls[row.rowId] = new FormControl(false);
            }
        }
    }

    openSideNav() {
        this.dialog.open(SidenavComponent, {
            position: this.isMobile() ? { bottom: '120px' } : { top: '90px', left: '30px' },
            width: this.isMobile() ? '90vw' : 'auto',
			height: 'auto',
			hasBackdrop: true,
            backdropClass: 'transparent-backdrop',
            data: 'custom-table'
        });
    }

    loadTable(tableId: number) {
        this.tableService.loadTable(tableId);
    }

    createTable() {
        this.dialog.open(TableConfigDialog, {
            width: 'auto',
            minWidth: this.isMobile() ? '90vw' : '600px',
            maxWidth: '95vw',
            data: { dialogMode: 'CreateTable' }
        }).afterClosed().subscribe(data => {
            if (data) {
                this.tableService.createTable(data).subscribe({
                    error: err => this.snackbarService.openSnackbar(err)
                });
            }
        });
    }

    editTable() {
        const tableId = this.tableService.tableId();
        const currentTable = this.tableService.currentTable();
        if (tableId === 0 || !currentTable) return;

        this.dialog.open(TableConfigDialog, {
            width: 'auto',
            minWidth: this.isMobile() ? '90vw' : '600px',
            maxWidth: '95vw',
            data: { dialogMode: 'EditTable', tableName: currentTable.name }
        }).afterClosed().subscribe(data => {
            if (data) {
                this.tableService.updateTable(tableId, data).subscribe({
                    error: err => this.snackbarService.openSnackbar(err)
                });
            }
        });
    }

    deleteTable() {
        const tableId = this.tableService.tableId();
        if (tableId === 0) return;

        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Tabelle löschen',
                message: 'Möchten Sie diese Tabelle wirklich mit allen Inhalten löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.',
                confirmText: 'Tabelle löschen',
                isDestructive: true
            }
        }).afterClosed().subscribe(result => {
            if (!result) return;
            this.tableService.deleteTable(tableId).subscribe({
                error: err => this.snackbarService.openSnackbar(err)
            });
        });
    }

    addColumn() {
        this.tableService.createColumn(this.tableService.tableId()).subscribe({
            error: err => this.snackbarService.openSnackbar(err)
        });
    }

    deleteColumn(event: MouseEvent, colId: number) {
        event.stopPropagation();
        
        this.dialog.open(ConfirmDialogComponent, {
            data: { 
                title: 'Spalte löschen', 
                message: 'Möchten Sie diese Spalte wirklich löschen? Alle darin enthaltenen Daten gehen unwiderruflich verloren.',
                confirmText: 'Spalte löschen',
                isDestructive: true
            }
        }).afterClosed().subscribe(result => {
            if (result) {
                this.tableService.deleteColumn(this.tableService.tableId(), colId).subscribe({
                    error: err => this.snackbarService.openSnackbar(err)
                });
            }
        });
    }
    
    editColumn(colId: number) {
        const col = this.tableService.columns().find(c => c.columnId === colId);
        if (!col) return;

        const hasValues = this.tableService.rows().some(row => {
            const value = row.cells[colId];
            return value !== null && value !== undefined && value !== '';
        });

        this.dialog.open(TableConfigDialog, {
            width: 'auto',
            minWidth: this.isMobile() ? '90vw' : '600px',
            maxWidth: '95vw',
            data: { dialogMode: 'EditColumn', col: col, hasValues: hasValues }
        }).afterClosed().subscribe(data => {
            if (data === true) {
                this.tableService.deleteColumn(this.tableService.tableId(), colId).subscribe({
                    error: err => this.snackbarService.openSnackbar(err)
                });
            } else if (data) {
                this.tableService.updateColumn(colId, data).subscribe({
                    error: err => this.snackbarService.openSnackbar(err)
                });
            }
        });
    }

    reorderColumns() {
        const cols = this.tableService.columns().map(col => ({
            id: col.columnId,
            name: col.name,
            order: col.colOrder
        }));

        this.dialog.open(ReorderColumnsDialogComponent, {
			width: this.isMobile() ? '100vw' : 'auto',
            height: this.isMobile() ? '100vh' : 'auto',
			minWidth: this.isMobile() ? '100vw' : '500px',
            maxWidth: this.isMobile() ? '100vw' : '1500px',
            panelClass: this.isMobile() ? 'full-screen-dialog' : '',
            data: { columns: cols }
        }).afterClosed().subscribe(result => {
            if (!result) return;
            this.tableService.updateColumnOrder(result).subscribe({
                error: err => this.snackbarService.openSnackbar(err)
            });
        });
    }

    addRow() {
        this.tableService.createRow(this.tableService.tableId()).subscribe({
            error: err => this.snackbarService.openSnackbar(err)
        });
    }

    dropRow(event: CdkDragDrop<RowInfo[]>) {
        if (event.previousIndex === event.currentIndex) return;

        const rows = [...this.tableService.rows()];
        moveItemInArray(rows, event.previousIndex, event.currentIndex);

        const updateDtos: UpdateRowOrderDto[] = rows.map((row, index) => ({
            rowId: row.rowId,
            rowOrder: index
        }));

        this.tableService.updateRowOrder(updateDtos).subscribe({
            next: () => this.tableService.loadTable(this.tableService.tableId()),
            error: err => this.snackbarService.openSnackbar(err)
        });
    }

    toggleRemoveMode() {
        this.removeRowsColumn.update(v => !v);
        if (!this.removeRowsColumn()) {
            Object.values(this.removeControls).forEach(control => control.setValue(false));
        }
    }

    hasCheckedRows() {
        return Object.values(this.removeControls).some(control => control.value);
    }

    deleteRows() {
        const rows = Object.entries(this.removeControls)
            .filter(([_, control]) => control.value)
            .map(([rowId]) => Number(rowId));

        if (rows.length === 0) return;

        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Zeilen löschen',
                message: 'Möchten Sie die ausgewählten Zeilen wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.',
                confirmText: 'Zeilen löschen',
                isDestructive: true
            }
        }).afterClosed().subscribe(result => {
            if (!result) return;
            this.tableService.deleteRows(this.tableService.tableId(), rows).subscribe({
                next: () => this.toggleRemoveMode(),
                error: err => this.snackbarService.openSnackbar(err)
            });
        });
    }

    toggleFabMenu() {
        this.isFabMenuOpen.update(v => !v);
    }

    onCellBlur(rowId: number, columnId: number) {
        const key = `${rowId}_${columnId}`;
        const value = this.formControls[key].value;
        this.tableService.upsertCell(rowId, columnId, value).subscribe({
            error: err => this.snackbarService.openSnackbar(err)
        });
    }

    focusOwnCell(event: MouseEvent) {
        const cell = event.currentTarget as HTMLElement;
        const input = cell.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
            'input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        if (input) {
            input.focus();
        }
    }
}
