import { Component, inject } from '@angular/core';
import { UI_MODULES } from '../../shared/material-ui';
import { MatDialog } from '@angular/material/dialog';
import { SidenavComponent } from '../../shared/sidenav/sidenav.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { ColumnInfo, CreateColumnDto, CreateTableDto, RowInfo, TableDetail, TableOverview } from './models/TableMetadata';
import { MatListModule } from '@angular/material/list';
import { CustomTableService } from './custom-table.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { CreationDialogComponent } from './creation-dialog/creation-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-custom-table',
  imports: [
    UI_MODULES,
    MatToolbarModule,
    MatCardModule,
    MatListModule,
    MatTableModule,
    MatPaginatorModule,
    MatTooltipModule
  ],
  templateUrl: './custom-table.component.html',
  styleUrl: './custom-table.component.scss'
})
export class CustomTableComponent {
    private readonly dialog = inject(MatDialog);
    private readonly tableService = inject(CustomTableService)

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
        // this.tableService.getTable(tableId).subscribe((table: TableDetail) => {
        //     console.log('Received table:', table);
        //     this.tableId = table.tableId;
        //     console.log('TableId:', this.tableId);
        //     this.columns = table.columns;
        //     console.log('Columns:', this.columns);
        //     this.displayedColumns = this.columns.map(c => c.columnId.toString());
        //     console.log('Displayed Columns:', this.displayedColumns);
        //     this.dataSource.data = table.rows;
        //     console.log('Table Rows:', table.rows);
        //     this.totalRows = table.rows.length;
        //     console.log('Total Rows:', this.totalRows);
        //     // this.dataSource.paginator = this.paginator;
        //     console.log("Col:", this.columns[0])
        // })

        this.tableService.getDevTable().subscribe((table: TableDetail) => {
            console.log('Received table:', table);
            this.tableId = table.tableId;
            this.columns = table.columns;
            console.log('Columns:', this.columns);
            this.displayedColumns = this.columns.map(c => c.columnId.toString());
            console.log('Displayed Columns:', this.displayedColumns);
            this.dataSource.data = table.rows;
            this.totalRows = table.rows.length;
            // this.dataSource.paginator = this.paginator;
        })
    }

    createTable() {
        this.dialog.open(CreationDialogComponent, {
            width: 'auto',
            minWidth: '600px',
            maxWidth: '1500px',
            height: 'auto',
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

    addColumn() {
        this.tableService.createColumn(this.tableId).subscribe(() => {
                this.loadTable(this.tableId);
            }
        );
    }

    addRow() {
    }
}
