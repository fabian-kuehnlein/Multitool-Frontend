export interface AuthState {
    isAuthenticated: boolean;
    isAdmin: boolean;
    userId: number | null;
    username: string | null;
}
