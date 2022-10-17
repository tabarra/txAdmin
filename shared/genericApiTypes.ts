export type GenericApiLogout = {
    success: true;
}
export type GenericApiSuccess = {
    logout: true;
}
export type GenericApiError = {
    error: string;
}

export type GenericApiResp = GenericApiLogout | GenericApiSuccess | GenericApiError;
