import { ColumnInfo } from "./column-info.model";
import { RowInfo } from "./row-info.model";

// full table structure
export interface TableDetail {
  tableId: number;
  name: string;
  createdAt: string;
  columns: ColumnInfo[];
  rows: RowInfo[];
}