export type DatabasePlayerType = {
    license: string;
    ids: string[];
    displayName: string;
    pureName: string;
    playTime: number;
    tsLastConnection: number;
    tsJoined: number;
    tsWhitelisted?: number;
    notes?: {
        text: string;
        lastAdmin: string | null;
        tsLastEdit: number | null;
    };
};
export type DatabaseActionType = {
    id: string;
    type: 'ban' | 'warn';
    identifiers: string[];
    playerName: string | false;
    reason: string;
    author: string;
    timestamp: number;
    expiration: number | false;
    revocation: {
        timestamp: number | null;
        author: string | null;
    };
};
export type DatabasePendingWLType = {
    id: string; //R####
    license: string;
    name: string;
    tsLastAttempt: number;
};

export type DatabaseDataType = {
    version: number,
    players: DatabasePlayerType[],
    actions: DatabaseActionType[],
    pendingWL: DatabasePendingWLType[],
};
