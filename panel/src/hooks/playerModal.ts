import { setUrlSearchParam } from "@/lib/utils";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { atomWithReset } from 'jotai/utils';


/**
 * Player Modal Stuff
 */
export type PlayerModalRefType = {
    mutex: string;
    netid: number;
} | {
    license: string;
};
export const playerModalOpenAtom = atomWithReset(false);
export const playerModalRefAtom = atomWithReset<PlayerModalRefType | undefined>(undefined);
export const playerModalUrlParam = 'playerModal';

//Helper to set the URL search param
export const setPlayerModalUrlParam = (ref: string | undefined) => {
    setUrlSearchParam(playerModalUrlParam, ref);
}

//Hook to open the player modal
export const useOpenPlayerModal = () => {
    const setModalRef = useSetAtom(playerModalRefAtom);
    const setModalOpen = useSetAtom(playerModalOpenAtom);
    return (data: Exclude<PlayerModalRefType, undefined>) => {
        const newRef = 'mutex' in data
            ? `${data.mutex}#${data.netid}`
            : data.license;
        setPlayerModalUrlParam(newRef);
        setModalRef(data);
        setModalOpen(true);
    }
};

//Hook to close the player modal
export const useClosePlayerModal = () => {
    const setModalOpen = useSetAtom(playerModalOpenAtom);
    return () => {
        setPlayerModalUrlParam(undefined);
        setModalOpen(false);
    }
};


//General hook for the state of the modal
export const usePlayerModalStateValue = () => {
    const playerRef = useAtomValue(playerModalRefAtom);
    const [isModalOpen, setIsModalOpen] = useAtom(playerModalOpenAtom);
    return {
        isModalOpen,
        playerRef,
        closeModal: () => {
            setPlayerModalUrlParam(undefined);
            setIsModalOpen(false);
        },
    }
}
