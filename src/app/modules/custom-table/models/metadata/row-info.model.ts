// row metadata
export interface RowInfo {
    rowId: number;
    createdAt: string;
    cells: Record<number, string | number | boolean | null>;
    rowOrder: number;
}
