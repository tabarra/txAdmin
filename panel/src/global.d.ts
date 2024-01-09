import { InjectedTxConsts } from '@shared/otherTypes';

type LogoutNoticeMessage = { type: 'logoutNotice' };
type OpenAccountModalMessage = { type: 'openAccountModal' };
type OpenPlayerModalMessage = { type: 'openPlayerModal', ref: PlayerModalRefType };
type navigateToPageMessage = { type: 'navigateToPage', href: string };
type liveConsoleSearchHotkeyMessage = { type: 'liveConsoleSearchHotkey', action: string };

export declare global {
    interface Window {
        txConsts: InjectedTxConsts;
        txIsMobile: boolean;
        invokeNative?: (nativeName: string, ...args: any[]) => void;
    }
    type TxMessageEvent = MessageEvent<LogoutNoticeMessage>
        | MessageEvent<OpenAccountModalMessage>
        | MessageEvent<OpenPlayerModalMessage>
        | MessageEvent<navigateToPageMessage>
        | MessageEvent<liveConsoleSearchHotkeyMessage>;
}
