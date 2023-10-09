import { InjectedTxConsts } from '@shared/InjectedTxConstsType';

export declare global {
    interface Window {
        txConsts: InjectedTxConsts;
    }
}
