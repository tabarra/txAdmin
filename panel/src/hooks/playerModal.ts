import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { atomWithReset } from 'jotai/utils';


/**
 * Prompt Dialog Stuff
 */
export type PlayerModalRefType = {
    mutex: string;
    netid: number;
} | {
    license: string;
} | undefined;
export const playerModalOpenAtom = atomWithReset(false);
export const playerModalRefAtom = atomWithReset<PlayerModalRefType>(undefined);

//Hook to open the player modal
export const useOpenPlayerModal = () => {
    const setModalRef = useSetAtom(playerModalRefAtom);
    const setModalOpen = useSetAtom(playerModalOpenAtom);
    return (data: Exclude<PlayerModalRefType, undefined>) => {
        setModalRef(data);
        setModalOpen(true);
    }
};


//General hook for the state of the modal
export const usePlayerModalStateValue = () => {
    const playerRef = useAtomValue(playerModalRefAtom);
    const [isModalOpen, setIsModalOpen] = useAtom(playerModalOpenAtom);
    return {
        isModalOpen,
        playerRef,
        closeModal: () => setIsModalOpen(false),
    }
}
