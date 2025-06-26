import { Component, inject } from '@angular/core';
import { UI_MODULES } from '../../shared/material-ui';
import { MatDialog } from '@angular/material/dialog';
import { SidenavComponent } from '../../shared/sidenav/sidenav.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { TableInfo } from './models/TableMetadata';
import { MatListModule } from '@angular/material/list';
import { CustomTableService } from './custom-table.service';
import { MatTableModule } from '@angular/material/table';
import { tap } from 'rxjs';

@Component({
  selector: 'app-custom-table',
  imports: [
    UI_MODULES,
    MatToolbarModule,
    MatCardModule,
    MatListModule,
    MatTableModule
  ],
  templateUrl: './custom-table.component.html',
  styleUrl: './custom-table.component.scss'
})
export class CustomTableComponent {
    private readonly dialog = inject(MatDialog);
    private readonly tableService = inject(CustomTableService)

    public tableList: TableInfo[] = [
      { tableId: "1", tableName: "BG3 Build Table"},
      { tableId: "2", tableName: "Elden Ring Build"}
    ]
    public readonly displayedColumns: string[] = [];

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
        this.tableService.getListOfTables().subscribe(list => {
            this.tableList = list;
        })
    }

    loadTable(id: string) {
        this.tableService.getColumns(id).subscribe(cols => {

        })
    }
}
