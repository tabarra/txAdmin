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

export type ApiToastResp = {
    type: 'success' | 'info' | 'warning' | 'danger', //based on the notify lib, change when possible
    markdown?: boolean,
    message: string,
}
