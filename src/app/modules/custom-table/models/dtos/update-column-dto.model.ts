import { CustomDataType } from '../enums/custom-data-type.enum';

export interface UpdateColumnDto {
    name: string;
    colOrder: number;
    dataType?: CustomDataType;
}
