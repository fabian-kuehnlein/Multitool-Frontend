import { Component, ElementRef, inject, OnInit, QueryList, ViewChild, ViewChildren, signal, computed, effect } from '@angular/core';
import { UI_MODULES } from '../../../../shared/utilities/material-ui';
import { MatDialog } from '@angular/material/dialog';
import { SidenavComponent } from '../../../../core/layout/sidenav/sidenav.component';
import { MatCardModule } from '@angular/material/card';
import { ColumnInfo, CustomDataType, RowInfo, UpdateRowOrderDto } from '../../models';
import { MatListModule } from '@angular/material/list';
import { CustomTableService } from '../../services/custom-table.service';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CreationDialogComponent } from './components/creation-dialog/creation-dialog.component';
import { FormControl, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { NgClass } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ReorderColumnsDialogComponent } from './components/reorder-columns-dialog/reorder-columns-dialog.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';

@Component({
  selector: 'app-custom-table',
  imports: [
    UI_MODULES,
    MatCardModule,
    MatListModule,
    MatTableModule,
    MatCheckboxModule,
    MatDatepickerModule,
    DragDropModule,
    NgClass
  ],
  templateUrl: './custom-table.component.html',
  styleUrl: './custom-table.component.scss'
})
export class CustomTableComponent implements OnInit {
    @ViewChild(MatTable) table!: MatTable<any>;
    @ViewChildren('cellInput') cellInputs!: QueryList<ElementRef<HTMLInputElement>>;

    private readonly dialog = inject(MatDialog);
    protected readonly tableService = inject(CustomTableService)
    private readonly snackbarService = inject(SnackbarService)

    // UI State Signals
    protected readonly removeRowsColumn = signal<boolean>(false);
    
    // Computed Signals
    protected readonly displayedColumns = computed(() => {
        const baseColumns = this.tableService.columns().map(col => col.columnId.toString());
        if (this.removeRowsColumn()) {
            return ['delete', ...baseColumns];
        }
        return ['drag', ...baseColumns];
    });

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
    }

    ngOnInit(): void {
        this.tableService.fetchTableList();
    }

    private initializeFormControls(rows: RowInfo[], columns: ColumnInfo[]) {
        // We keep existing controls to avoid losing focus if only data changes
        // But for a full table load, we might want to refresh.
        // For simplicity, we just rebuild for now.
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
            position: { top: '90px', left: '30px' },
            height: 'auto',
            minHeight: '100px',
            maxHeight: '1000px',
            hasBackdrop: true,
            backdropClass: 'transparent-backdrop',
            data: 'custom-table'
        });
    }

    loadTable(tableId: number) {
        this.tableService.loadTable(tableId);
    }

    createTable() {
        this.dialog.open(CreationDialogComponent, {
            width: 'auto',
            minWidth: '600px',
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

        this.dialog.open(CreationDialogComponent, {
            width: 'auto',
            minWidth: '600px',
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

        this.dialog.open(ConfirmDialogComponent).afterClosed().subscribe(result => {
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
    
    editColumn(colId: number) {
        const col = this.tableService.columns().find(c => c.columnId === colId);
        if (!col) return;

        const hasValues = this.tableService.rows().some(row => {
            const value = row.cells[colId];
            return value !== null && value !== undefined && value !== '';
        });

        this.dialog.open(CreationDialogComponent, {
            width: 'auto',
            minWidth: '600px',
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
            width: 'auto',
            minWidth: '500px',
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

        this.tableService.deleteRows(this.tableService.tableId(), rows).subscribe({
            next: () => this.toggleRemoveMode(),
            error: err => this.snackbarService.openSnackbar(err)
        });
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
