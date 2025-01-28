import { useEffect, useId, useState } from "react";
import { dequal } from 'dequal/lite';
import { GetConfigsResp, PartialTxConfigs, TxConfigs } from "@shared/otherTypes";


/**
 * Types
 */
export type SettingsTabInfo = {
    tabId: string; //eg. game
    tabName: string; //eg. Game
}
export type SettingsCardInfo = {
    cardId: string; //eg. game-menu
    cardName: string; //eg. Menu
    cardTitle: string; //eg. Game Menu
}

export type SettingsCardContext = SettingsTabInfo & SettingsCardInfo;

export type SettingsPageContext = {
    apiData?: GetConfigsResp;
    isReadOnly: boolean;
    isLoading: boolean;
    isSaving: boolean;
    swrError: string | undefined;
    cardPendingSave: SettingsCardContext | null;
    setCardPendingSave: (state: SettingsCardContext | null) => void;
    saveChanges: (card: SettingsCardContext, changes: PartialTxConfigs) => Promise<void>;
}

export type SettingsCardProps = {
    cardCtx: SettingsCardContext;
    pageCtx: SettingsPageContext;
};


/**
 * Hook that appends a unique ID to the given string
 */
export const useIdForContext = (ctx: string) => {
    const ctxId = ctx + useId();
    return (id: string) => {
        return ctxId + id;
    }
}


/**
 * Helper function to get a stored or default value from the API data
 */
export const useConfAccessor = (apiData: GetConfigsResp | undefined) => {
    const ctxId = useId();
    return <
        S extends keyof TxConfigs,
        T extends TxConfigs[S][K],
        K extends keyof TxConfigs[S] extends string ? keyof TxConfigs[S] : never,
    >(scope: S, key: K) => {
        const [value, setValue] = useState<Exclude<T, null> | undefined>(undefined);
        const getApiValues = () => {
            //@ts-ignore couldn't figure out how to make this work
            const storedValue = apiData?.storedConfigs?.[scope]?.[key] as T | undefined;
            const defaultValue = apiData?.defaultConfigs?.[scope]?.[key] as T | undefined;
            const initialValue = storedValue !== undefined && storedValue !== null
                ? storedValue
                : defaultValue;
            return {
                storedValue,
                defaultValue,
                initialValue: initialValue as Exclude<T, null> | undefined,
            };
        }

        const discardValue = () => setValue(getApiValues().initialValue);
        useEffect(() => {
            discardValue();
        }, [apiData]);

        const apiDataValues = getApiValues();
        return {
            scope,
            key,
            eid: `${ctxId}:${key}`,
            defaultValue: apiDataValues.defaultValue,
            initialValue: apiDataValues.initialValue,
            state: {
                value,
                set: setValue,
                discard: discardValue,
                default: () => setValue(apiDataValues.defaultValue as any),
            },
            hasChanged: (currVal: unknown) => {
                return apiData !== undefined
                    && currVal !== undefined
                    && !dequal(currVal, getApiValues().initialValue);
            },
        };
    }
}

type ConfigValueAccessor = {
    scope: string;
    key: string;
    initialValue: any;
    hasChanged: (currVal: unknown) => boolean;
};


/**
 * Helper function to diff the current value against the stored value and return a PartialTxConfigs object
 */
export const diffConfig = (configs: DiffConfigInput[]) => {
    const diff: any = {};
    let hasChanges = false;
    console.groupCollapsed('Settings Diffing:');
    for (const [config, newVal] of configs) {
        const hasChanged = config.hasChanged(newVal);
        console.log(
            hasChanged,
            config.scope,
            config.key,
            {
                initial: config.initialValue,
                current: newVal
            }
        );
        if (!config.hasChanged(newVal)) continue;
        hasChanges = true;
        diff[config.scope] ??= {};
        diff[config.scope][config.key] = newVal;
    }
    console.log('Final diff:', diff);
    console.groupEnd();

    return hasChanges
        ? diff as PartialTxConfigs
        : undefined;
}

type DiffConfigInput = [
    config: ConfigValueAccessor,
    newVal: any
];
