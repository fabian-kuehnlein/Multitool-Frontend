import { Component, ElementRef, inject, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { UI_MODULES } from '../../../../shared/utilities/material-ui';
import { MatDialog } from '@angular/material/dialog';
import { SidenavComponent } from '../../../../core/layout/sidenav/sidenav.component';
import { MatCardModule } from '@angular/material/card';
import { ColumnInfo, CustomDataType, RowInfo, TableDetail, TableOverview, UpdateRowOrderDto } from '../../models';
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
    private readonly tableService = inject(CustomTableService)
    private readonly snackbarService = inject(SnackbarService)

    public formControls: { [key: string]: FormControl } = {};
    public removeControls: { [rowId: number]: FormControl} = {};

    public tableList: TableOverview[] = [];

    public tableId = 0;
    public columns: ColumnInfo[] = [];
    public displayedColumns: string[] = [];
    public dataSource = new MatTableDataSource<RowInfo>();

    public totalRows = 0;

    public removeRowsColumn: boolean = false;

    openSideNav() {
        this.dialog.open(SidenavComponent, {
        position: {
            top: '90px',
            left: '30px'
        },
        height: 'auto',
        minHeight: '100px',
        maxHeight: '1000px',
        hasBackdrop: true,
        backdropClass: 'transparent-backdrop',
        data: 'custom-table'
        }).afterClosed();
    }

    ngOnInit(): void {
        this.loadTableList();
    }

    initializeFormControl() {
        for (const row of this.dataSource.data) {
            for (const col of this.columns) {
                const key = `${row.rowId}_${col.columnId}`;
                if (col.dataType === CustomDataType.Int) {
                    // Intiger Validation
                    this.formControls[key] = new FormControl(row.cells[col.columnId] || '', [Validators.pattern(/^\d+$/)])
                } else if (col.dataType === CustomDataType.Decimal) {
                    // Decimal Validation
                    this.formControls[key] = new FormControl(row.cells[col.columnId] || '', [Validators.pattern(/^\d+(\.\d{1,2})?$/)])
                } else {
                    // Normal Textfield
                    this.formControls[key] = new FormControl(row.cells[col.columnId] || '');
                }
            }
        }

        this.dataSource.data.forEach(row => {
            if (!this.removeControls[row.rowId]) {
                this.removeControls[row.rowId] = new FormControl(false);
            }
        })
    };

    onCellBlur(rowId: number, columnId: number) {
        const key = `${rowId}_${columnId}`;
        const value = this.formControls[key].value;
        this.setCellValue(rowId, columnId, value);
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

    loadTableList() {
        this.tableService.getListOfTables().subscribe({
            next: list => {
                this.tableList = list;
            },
            error: err => {
                this.snackbarService.openSnackbar(err);
            }
        });
    }

    loadTable(tableId: number) {
        this.tableService.getTable(tableId).subscribe((table: TableDetail) => {
            this.tableId = table.tableId;
            this.columns = table.columns;
            this.displayedColumns = ['drag', ...this.columns.map(c => c.columnId.toString())];
            this.dataSource.data = table.rows.sort((a, b) => a.rowOrder - b.rowOrder);
            this.totalRows = table.rows.length;

            this.initializeFormControl();
        })
    }

    createTable() {
        this.dialog.open(CreationDialogComponent, {
            width: 'auto',
            minWidth: '600px',
            maxWidth: '1500px',
            height: 'auto',
            data: { dialogMode: 'CreateTable'}
        }).afterClosed().subscribe(data => {
            if (data)
            {
                this.tableService.createTable(data).subscribe({
                    next: id => {
                        this.loadTableList();
                        this.loadTable(id);
                    },
                    error: err => {
                        this.snackbarService.openSnackbar(err);
                    }
                });
            }
        });
    }

    editTable() {
        this.dialog.open(CreationDialogComponent, {
            width: 'auto',
            minWidth: '600px',
            maxWidth: '1500px',
            height: 'auto',
            data: { dialogMode: 'EditTable', tableName: this.tableList.find(t => t.tableId === this.tableId)?.name }
        }).afterClosed().subscribe(data => {
            if (data)
            {
                this.tableService.updateTable(this.tableId, data).subscribe({
                    next: () => {
                        this.loadTableList();
                    },
                    error: err => {
                        this.snackbarService.openSnackbar(err);
                    }
                });
            }
        });
    }

    deleteTable() {
        this.dialog.open(ConfirmDialogComponent).afterClosed().subscribe(result => {
            if (!result) return;

            this.tableService.deleteTable(this.tableId).subscribe({
                next: () => {
                    this.loadTableList();
                    this.tableId = 0;
                },
                error: err => {
                    this.snackbarService.openSnackbar(err);
                }
            });
        })
    }

    addColumn() {
        this.tableService.createColumn(this.tableId).subscribe({
                next: () => {
                    this.loadTable(this.tableId);
                },
                error: err => {
                    this.snackbarService.openSnackbar(err);
                }
            });
    }
    
    editColumn(colId: number) {
        const col = this.columns.find(c => c.columnId === colId);
        if (!col) return;

        const hasValues = this.dataSource.data.some(row => {
            const value = row.cells[colId];
            return value !== null && value !== undefined && value !== ''
        })

        this.dialog.open(CreationDialogComponent, {
            width: 'auto',
            minWidth: '600px',
            maxWidth: '1500px',
            height: 'auto',
            data: { dialogMode: 'EditColumn', col: col, hasValues: hasValues }
        }).afterClosed().subscribe(data => {
            if (data === true) {
                this.tableService.deleteColumn(this.tableId, colId).subscribe({
                    next: () => {
                        this.loadTable(this.tableId);
                    },
                    error: err => {
                        this.snackbarService.openSnackbar(err);
                    }
                });
            } else if (data)
            {
                this.tableService.updateColumn(this.tableId, colId, data).subscribe({
                    next: () => {
                        this.loadTable(this.tableId);
                    },
                    error: err => {
                        this.snackbarService.openSnackbar(err);
                    }
                });
            }
        });
    }

    reorderColumns() {
        const cols = this.columns.map(col => ({
            id: col.columnId,
            name: col.columnName,
            order: col.colOrder
        }))

        this.dialog.open(ReorderColumnsDialogComponent, {
                width: 'auto',
                minWidth: '500px',
                maxWidth: '90vw',
                data: {columns: cols}
            }).afterClosed().subscribe(result => {
            if (!result) return;

            this.tableService.updateColumnOrder(result).subscribe({
                next: () => {
                    this.loadTable(this.tableId);
                },
                error: err => {
                    this.snackbarService.openSnackbar(err);
                }
            });
        });
    }

    addRow() {
        this.tableService.createRow(this.tableId).subscribe({
            next: () => {
                this.loadTable(this.tableId);
            },
            error: err => {
                this.snackbarService.openSnackbar(err);
            }
        });
    }

    dropRow(event: CdkDragDrop<RowInfo[]>) {
        if (event.previousIndex === event.currentIndex) return;

        moveItemInArray(this.dataSource.data, event.previousIndex, event.currentIndex);

        this.table.renderRows();

        const updateDtos: UpdateRowOrderDto[] = this.dataSource.data.map((row, index) => ({
            rowId: row.rowId,
            rowOrder: index
        }));

        this.tableService.updateRowOrder(updateDtos).subscribe({
            error: err => {
                this.snackbarService.openSnackbar(err);
            }
        })
    }

    toggleRemoveMode() {
        this.removeRowsColumn = !this.removeRowsColumn;

        const baseColumns = this.columns.map(col => col.columnId.toString());
        this.displayedColumns = this.removeRowsColumn ? ['delete', ...baseColumns] : ['drag', ...baseColumns];

        if (this.removeRowsColumn === false) {
            Object.values(this.removeControls).forEach(control => control.setValue(false));
        }
    }

    // disables delete button if no row is selected to delete
    hasCheckedRows() {
        return Object.values(this.removeControls).some(control => control.value);
    }

    deleteRows() {
        const rows = Object.entries(this.removeControls).filter(([_, control]) => control.value).map(([rowId], _) => Number(rowId));

        if (rows.length === 0) return;

        this.tableService.deleteRows(this.tableId, rows).subscribe({
            next: () => {
                this.loadTable(this.tableId);
                this.toggleRemoveMode();
            },
            error: err => {
                this.snackbarService.openSnackbar(err);
            }
        });
    }

    setCellValue(rowId: number, columnId: number, value: any) {
        this.tableService.upsertCell(rowId, columnId, value).subscribe({
            error: err => {
                this.snackbarService.openSnackbar(err);
            }
        });
    }
}
