import { GenericApiErrorResp } from "genericApiTypes";

//Already compliant with new db specs
export type PlayerHistoryItem = {
    id: string;
    type: "ban" | "warn";
    author: string;
    reason: string;
    ts: number;
    exp?: number;
    revokedBy?: string;
    revokedAt?: number;
}

export type PlayerModalPlayerData = {
    //common
    displayName: string;
    pureName: string;
    isRegistered: boolean;
    isConnected: boolean;
    ids: string[]; //can be empty
    hwids: string[]; //can be empty
    license: string | null;
    actionHistory: PlayerHistoryItem[]; //can be empty

    //only if server player
    netid?: number;
    sessionTime?: number; //calcular baseado no tsConnected

    //only if registered
    tsJoined?: number;
    tsWhitelisted?: number;
    playTime?: number;
    notesLog?: string;
    notes?: string;
    oldIds?: string[]; //will also include the current ones
    oldHwids?: string[]; //will also include the current ones
    tsLastConnection?: number; //only show if offline
}

export type PlayerModalSuccess = {
    serverTime: number; //required to calculate if bans have expired on frontend
    player: PlayerModalPlayerData;
}
export type PlayerModalResp = PlayerModalSuccess | GenericApiErrorResp;
