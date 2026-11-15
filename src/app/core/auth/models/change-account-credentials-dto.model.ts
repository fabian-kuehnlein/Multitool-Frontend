export interface ChangeAccountCredentialsDto {
    currentPassword: string;
    newUsername?: string;
    newPassword?: string;
}
