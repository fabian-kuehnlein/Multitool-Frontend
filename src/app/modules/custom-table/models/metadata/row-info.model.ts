// cell value as stored/transmitted for any custom data type
export type CellValue = string | number | boolean | null;

// row metadata
export interface RowInfo {
    rowId: number;
    createdAt: string;
    cells: Record<number, CellValue>;
    rowOrder: number;
}
