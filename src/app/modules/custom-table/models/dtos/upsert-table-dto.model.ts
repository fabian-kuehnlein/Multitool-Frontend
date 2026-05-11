import { CreateColumnDto } from "./create-column-dto.model";

// Create- and Update-Calls
export interface UpsertTableDto {
  name: string;
  column: CreateColumnDto;
}