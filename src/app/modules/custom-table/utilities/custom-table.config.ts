import { CustomDataType } from '../models';

export enum DialogMode {
    CreateTable = 'CreateTable',
    EditTable = 'EditTable',
    EditColumn = 'EditColumn',
}

export interface DataTypeOption {
    value: CustomDataType;
    label: string;
}

export const DATA_TYPE_OPTIONS: readonly DataTypeOption[] = [
    { value: CustomDataType.String, label: 'Text (Standard)' },
    { value: CustomDataType.Int, label: 'Zahl' },
    { value: CustomDataType.Decimal, label: 'Gleitkommazahl' },
    { value: CustomDataType.Date, label: 'Datum' },
    { value: CustomDataType.Bool, label: 'Checkbox' },
];
