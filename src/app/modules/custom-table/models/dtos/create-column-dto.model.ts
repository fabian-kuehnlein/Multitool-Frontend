import { CustomDataType } from '../enums/custom-data-type.enum';

export interface CreateColumnDto {
    name: string;
    dataType: CustomDataType;
    colOrder: number;
}
