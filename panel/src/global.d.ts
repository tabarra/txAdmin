import { InjectedTxConsts } from '@shared/otherTypes';

type LogoutNoticeMessage = { type: 'logoutNotice' }

export declare global {
    interface Window {
        txConsts: InjectedTxConsts;
    }
    type MessageEventFromIframe = MessageEvent<LogoutNoticeMessage>
}
