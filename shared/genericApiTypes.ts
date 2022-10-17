export type GenericApiError = {
    error: string;
}
export type GenericApiSuccess = {
    logout: true;
}
export type GenericApiLogout = {
    success: true;
}
export type GenericApiResp = GenericApiLogout | GenericApiSuccess | GenericApiError;
