
export interface TableInfo {
    tableId: string;
    tableName: string;
}

// ui-table.model.ts
export interface UiTable {
  tableId: string;
  tableName: string;
  columns: UiColumn[];        // wird per JOIN oder extra Call geladen
  rows: UiRow[];              // dto.
}

export interface UiColumn {
  columnId: string;
  tableId: string;
  key: string;
  header: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'select';
  index: number;
  /** Frei für später: Dropdown-Werte, Validierung, Referenzen … */
  options?: Record<string, any>;
}

export interface UiRow {
  rowId: string;
  tableId: string;
  index: number;
  /** Key–Value-Map, Keys = column.key */
  data: Record<string, any>;
}

export interface ColumnsResponse {
    tableId: string,
    tableName: string,
    columns: UiColumn[]
}

export interface RowsResponse {
    rows: UiRow[],
    total: number
}