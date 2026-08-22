export interface Category {
    id: number;
    name: string;
    color: string;
}

export interface CreateCategoryDto {
    name: string;
    color: string;
}

export interface UpdateCategoryDto extends CreateCategoryDto {}
