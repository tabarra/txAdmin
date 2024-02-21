export type ApiAuthErrorResp = {
    logout: true;
    reason: string;
}
export type GenericApiSuccessResp = {
    success: true;
}
export type GenericApiErrorResp = {
    error: string;
}
export type GenericApiResp = ApiAuthErrorResp | GenericApiSuccessResp | GenericApiErrorResp;
export type GenericApiOkResp = GenericApiSuccessResp | GenericApiErrorResp;

export type ApiToastResp = {
    type: 'default' | 'info' | 'success' | 'warning' | 'error',
    title?: string,
    msg: string,
    md?: boolean,
}
