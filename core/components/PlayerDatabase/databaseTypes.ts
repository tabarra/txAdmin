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
    identifiers: string[];
    playerName: string | false;
    type: 'ban' | 'warn' | 'whitelist';
    author: string;
    reason: string | null; //whitelists are saving it as null
    timestamp: number;
    expiration: number | false;
    revocation: {
        timestamp: number | null;
        author: string | null;
    };
};
export type DatabasePendingWLType = {
    id: string;
    license: string;
    name: string;
    tsLastAttempt: number;
};

export type DatabaseType = {
    version: number,
    players: DatabasePlayerType[],
    actions: DatabaseActionType[],
    pendingWL: DatabasePendingWLType[],
};
