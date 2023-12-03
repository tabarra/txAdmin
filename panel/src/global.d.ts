import { InjectedTxConsts } from '@shared/otherTypes';

type LogoutNoticeMessage = { type: 'logoutNotice' }

export declare global {
    interface Window {
        txConsts: InjectedTxConsts;
        invokeNative?: (nativeName: string, ...args: any[]) => void;
    }
    type MessageEventFromIframe = MessageEvent<LogoutNoticeMessage>
}
