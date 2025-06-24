import { Component, inject } from '@angular/core';
import { UI_MODULES } from '../../shared/material-ui';
import { MatDialog } from '@angular/material/dialog';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-custom-table',
  imports: [
    UI_MODULES,
    MatToolbarModule
  ],
  templateUrl: './custom-table.component.html',
  styleUrl: './custom-table.component.scss'
})
export class CustomTableComponent {
    private readonly dialog = inject(MatDialog);

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
}
