import { GlobalStatusType } from "@shared/socketioTypes";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { io } from "socket.io-client";


export const getSocket = (rooms: string[] | string) => {
    const socketOpts = {
        transports: ['polling'],
        upgrade: false,
        query: { rooms }
    };

    const socket = window.txConsts.isWebInterface
        ? io({ ...socketOpts, path: '/socket.io' })
        : io('monitor', { ...socketOpts, path: '/WebPipe/socket.io' });

    return socket;
}

/**
 * Consts
 */
export const globalStatusAtom = atom<GlobalStatusType | null>(null);
export const serverNameAtom = atom((get) => get(globalStatusAtom)?.server.name ?? 'unconfigured')


/**
 * Hooks
 */
export const useSetGlobalStatus = () => {
    return useSetAtom(globalStatusAtom);
};

export const useGlobalStatus = () => {
    return useAtomValue(globalStatusAtom);
}
