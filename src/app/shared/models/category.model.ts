import { AppModule } from './app-module.enum';

export interface Category {
    id: number;
    name: string;
    color: string;
    applicableModules: AppModule[];
    isDeleted: boolean;
}

export interface CreateCategoryDto {
    name: string;
    color: string;
    applicableModules: AppModule[];
}

export interface UpdateCategoryDto extends CreateCategoryDto {}
