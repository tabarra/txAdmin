import { InjectedTxConsts } from '@shared/otherTypes';

type LogoutNoticeMessage = { type: 'logoutNotice' }
type OpenAccountModalMessage = { type: 'openAccountModal' }
type OpenPlayerModalMessage = { type: 'openPlayerModal', ref: PlayerModalRefType }
type navigateToPageMessage = { type: 'navigateToPage', href: string }

export declare global {
    interface Window {
        txConsts: InjectedTxConsts;
        txIsMobile: boolean;
        invokeNative?: (nativeName: string, ...args: any[]) => void;
    }
    type MessageEventFromIframe = MessageEvent<LogoutNoticeMessage>
        | MessageEvent<OpenAccountModalMessage>
        | MessageEvent<OpenPlayerModalMessage>
        | MessageEvent<navigateToPageMessage>;
}
