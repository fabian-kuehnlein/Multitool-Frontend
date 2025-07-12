import { Component, ElementRef, inject, QueryList, ViewChildren } from '@angular/core';
import { UI_MODULES } from '../../shared/material-ui';
import { MatDialog } from '@angular/material/dialog';
import { SidenavComponent } from '../../shared/sidenav/sidenav.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { ColumnInfo, CustomDataType, RowInfo, TableDetail, TableOverview } from './models/TableMetadata';
import { MatListModule } from '@angular/material/list';
import { CustomTableService } from './custom-table.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { CreationDialogComponent } from './creation-dialog/creation-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormControl, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-custom-table',
  imports: [
    UI_MODULES,
    MatToolbarModule,
    MatCardModule,
    MatListModule,
    MatTableModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule
  ],
  templateUrl: './custom-table.component.html',
  styleUrl: './custom-table.component.scss'
})
export class CustomTableComponent {
    @ViewChildren('cellInput') cellInputs!: QueryList<ElementRef<HTMLInputElement>>;

    private readonly dialog = inject(MatDialog);
    private readonly tableService = inject(CustomTableService)

    formControls: { [key: string]: FormControl } = {};

    public tableList: TableOverview[] = [];

    public tableId = 0;
    public columns: ColumnInfo[] = [];
    public displayedColumns: string[] = [];
    public dataSource = new MatTableDataSource<RowInfo>();

    public totalRows = 0;
    public pageSize = 10;

    openSideNav() {
      const dialogRef = this.dialog.open(SidenavComponent, {
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
      });
  
      dialogRef.afterClosed();
    }

    ngOnInit() {
        this.loadTableList();
        this.loadTable(1);
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
                // add error snackbar later
                console.error(err);
            }
        });
    }

    loadTable(tableId: number) {
        this.tableService.getTable(tableId).subscribe((table: TableDetail) => {
            console.log('Received table:', table);
            this.tableId = table.tableId;
            console.log('TableId:', this.tableId);
            this.columns = table.columns;
            console.log('Columns:', this.columns);
            this.displayedColumns = this.columns.map(c => c.columnId.toString());
            console.log('Displayed Columns:', this.displayedColumns);
            this.dataSource.data = table.rows;
            console.log('Table Rows:', table.rows);
            this.totalRows = table.rows.length;
            console.log('Total Rows:', this.totalRows);
            // this.dataSource.paginator = this.paginator;
            console.log("Col:", this.columns[0]);
            this.initializeFormControl();
        })

        // this.tableService.getDevTable().subscribe((table: TableDetail) => {
        //     this.tableId = table.tableId;
        //     this.columns = table.columns;
        //     this.displayedColumns = this.columns.map(c => c.columnId.toString());
        //     this.dataSource.data = table.rows;
        //     this.totalRows = table.rows.length;
        //     // this.dataSource.paginator = this.paginator;
        //     this.initializeFormControl();
        // })
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
                this.tableService.createTable(data).subscribe(id => {
                        this.loadTableList();
                        this.loadTable(id);
                    }
                );
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
                this.tableService.updateTable(this.tableId, data).subscribe(() => {
                    this.loadTableList()
                });
            }
        });
    }

    addColumn() {
        this.tableService.createColumn(this.tableId).subscribe(() => {
                this.loadTable(this.tableId);
            }
        );
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
            if (data)
            {
                this.tableService.updateColumn(this.tableId, colId, data).subscribe(() => {
                    this.loadTable(this.tableId);
                })
            }
        });
    }

    addRow() {
        this.tableService.createRow(this.tableId).subscribe(() => {
                this.loadTable(this.tableId);
            }
        );
    }

    setCellValue(rowId: number, columnId: number, value: any) {
        this.tableService.upsertCell(rowId, columnId, value).subscribe({
            // error: err => {
            //     //Add error snackbar later
            //     console.error(err);
            // }
        });
    }
}
