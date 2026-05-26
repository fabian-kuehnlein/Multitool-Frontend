import { CustomDataType } from "../enums/custom-data-type.model";

// column metadata
export interface ColumnInfo {
    columnId: number;
    name: string;
    dataType: CustomDataType;
    colOrder: number;
}