import type { InjectedTxConsts } from '@shared/otherTypes';
import type { GlobalHotkeyAction } from './lib/hotkeyEventListener';

type LogoutNoticeMessage = { type: 'logoutNotice' };
type OpenAccountModalMessage = { type: 'openAccountModal' };
type OpenPlayerModalMessage = { type: 'openPlayerModal', ref: PlayerModalRefType };
type navigateToPageMessage = { type: 'navigateToPage', href: string };
type liveConsoleSearchHotkeyMessage = { type: 'liveConsoleSearchHotkey', action: string };
type globalHotkeyMessage = {
    type: 'globalHotkey';
    action: GlobalHotkeyAction;
};

export declare global {
    interface Window {
        nuiSystemLanguages?: string | string[];
        txConsts: InjectedTxConsts;
        txIsMobile: boolean;
        invokeNative?: (nativeName: string, ...args: any[]) => void;
    }
    type TxMessageEvent = MessageEvent<LogoutNoticeMessage>
        | MessageEvent<OpenAccountModalMessage>
        | MessageEvent<OpenPlayerModalMessage>
        | MessageEvent<navigateToPageMessage>
        | MessageEvent<liveConsoleSearchHotkeyMessage>
        | MessageEvent<globalHotkeyMessage>;
}
