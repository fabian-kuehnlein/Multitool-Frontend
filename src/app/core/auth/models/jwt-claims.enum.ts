export enum JwtClaims {
    EXPIRY = 'exp',
    ROLE = 'role',
    ROLE_MICROSOFT = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
    ROLE_CAPITALIZED = 'Role',
    USER_ID = 'nameid',
    USER_ID_MICROSOFT = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
    SUBJECT = 'sub',
    USERNAME = 'unique_name',
    USERNAME_MICROSOFT = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
    NAME = 'name',
    MUST_CHANGE_PASSWORD = 'must_change_password',
}
