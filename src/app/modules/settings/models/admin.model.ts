export enum UserRole {
    USER = 0,
    ADMIN = 1,
}

export type UserRoleValue = UserRole | string | number;

export interface AdminUserModel {
    id: number;
    username: string;
    role: UserRoleValue;
    isActive: boolean;
    createdAt: string;
}

export interface CreateUserDto {
    username: string;
    password: string;
    role: UserRole;
}

export interface ResetPasswordDto {
    password: string;
}

export interface SetUserActiveDto {
    isActive: boolean;
}
