import { CustomDataType } from "../enums/custom-data-type.model";

export interface CreateColumnDto {
  name: string;
  dataType: CustomDataType;
  colOrder: number;
}