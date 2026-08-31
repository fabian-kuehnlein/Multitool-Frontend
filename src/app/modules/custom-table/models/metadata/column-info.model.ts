import { CustomDataType } from '../enums/custom-data-type.enum';

// column metadata
export interface ColumnInfo {
    columnId: number;
    name: string;
    dataType: CustomDataType;
    colOrder: number;
}
