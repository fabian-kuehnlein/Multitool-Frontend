import { CustomDataType } from '../models';

export interface DataTypeOption {
    value: CustomDataType;
    label: string;
}

export const DATA_TYPE_OPTIONS: readonly DataTypeOption[] = [
    { value: CustomDataType.STRING, label: 'Text (Standard)' },
    { value: CustomDataType.INT, label: 'Zahl' },
    { value: CustomDataType.DECIMAL, label: 'Gleitkommazahl' },
    { value: CustomDataType.DATE, label: 'Datum' },
    { value: CustomDataType.BOOL, label: 'Checkbox' },
];
