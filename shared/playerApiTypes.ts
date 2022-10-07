//Already compliant with new db specs
export type PlayerHistoryItem = {
    id: string;
    type: "ban" | "warn";
    author: string;
    reason: string;
    ts: number;
    exp?: number;
    revokedBy?: string;
}

export type PlayerModalMeta = {
    onJoinCheckBan: boolean;
    onJoinCheckWhitelist: boolean;
    serverTime: number; //required to calculate if bans have expired on frontend
    tmpPerms: {
        message: boolean;
        whitelist: boolean;
        warn: boolean;
        kick: boolean;
        ban: boolean;
    };
}

export type PlayerModalPlayerData = {
    //common
    displayName: string; //DONE
    isRegistered: boolean;
    isConnected: boolean;
    ids: string[]; //can be empty //DONE
    license: string | false;
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
}

export type PlayerModalSuccess = {
    meta: PlayerModalMeta
    player: PlayerModalPlayerData,
}
export type PlayerModalError = {
    error: string;
}
export type PlayerModalResp = PlayerModalSuccess | PlayerModalError;
