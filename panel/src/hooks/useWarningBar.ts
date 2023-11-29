import { UpdateDataType } from '@shared/otherTypes';
import { UpdateAvailableEventType } from '@shared/socketioTypes';
import { atom, useAtom, useSetAtom } from 'jotai';


/**
 * Atoms
 */
const offlineWarningAtom = atom(false);
const fxUpdateDataAtom = atom<UpdateDataType>(window.txConsts.fxsOutdated);
const txUpdateDataAtom = atom<UpdateDataType>(window.txConsts.txaOutdated);


/**
 * Hooks
 */
export default function useWarningBar() {
    const [offlineWarning, setOfflineWarning] = useAtom(offlineWarningAtom);
    const [fxUpdateData, setFxUpdateData] = useAtom(fxUpdateDataAtom);
    const [txUpdateData, setTxUpdateData] = useAtom(txUpdateDataAtom);

    return {
        offlineWarning, setOfflineWarning,
        fxUpdateData, setFxUpdateData,
        txUpdateData, setTxUpdateData,
    };
}

//Marks the socket as offline or online
export const useSetOfflineWarning = () => {
    return useSetAtom(offlineWarningAtom);
}

export const useProcessUpdateAvailableEvent = () => {
    const setFxUpdateData = useSetAtom(fxUpdateDataAtom);
    const setTxUpdateData = useSetAtom(txUpdateDataAtom);

    return (event: UpdateAvailableEventType) => {
        setFxUpdateData(event.fxserver);
        setTxUpdateData(event.txadmin);

        //Hacky override to prevent sticky update warnings after updating
        //NOTE: after adding the version check on socket handshake, i'm not sure if this is still required
        window.txConsts.fxsOutdated = event.fxserver;
        window.txConsts.txaOutdated = event.txadmin;
    }
};
