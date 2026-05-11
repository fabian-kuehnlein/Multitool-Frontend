import { CustomDataType } from "../enums/custom-data-type.model";

export interface UpdateColumnDto {
  name: string;
  colOrder: number;
  dataType?: CustomDataType;
}