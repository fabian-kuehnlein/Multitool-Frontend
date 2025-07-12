export enum CustomDataType {
    String  = 'string',
    Int     = 'int',
    Decimal = 'decimal',
    Date    = 'date',
    Bool    = 'bool'
}

// list of tables on the left side
export interface TableOverview {
    tableId: number;
    name: string;
}

// column metadata
export interface ColumnInfo {
    columnId: number;
    columnName: string;
    dataType: CustomDataType;
    colOrder: number;
}

// row metadata
export interface RowInfo {
    rowId: number;
    createdAt: string;
    cells: Record<number, string | number | boolean | null>;
}

// full table structure
export interface TableDetail {
  tableId: number;
  name: string;
  createdAt: string;
  columns: ColumnInfo[];
  rows: RowInfo[];
}

// Create- and Update-Calls
export interface CreateTableDto {
  name: string;
  column: CreateColumnDto;
}

export interface CreateColumnDto {
  name: string;
  dataType: CustomDataType;
  colOrder: number;
}

export interface UpdateColumnDto {
  name: string;
  colOrder: number;
  dataType?: CustomDataType;
}

export interface CreateRowDto {
  cells: Record<number, string | number | boolean | null>;
}

export interface UpdateRowDto {
  cells: Record<number, string | number | boolean | null>;
}