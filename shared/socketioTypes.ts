export type GlobalStatusType = {
    discord: false | string;
    server: {
        mutex: string | null;
        status: string;
        process: string;
        name: string;
        players: number;
    };
    scheduler: {
        nextRelativeMs: number;
        nextSkip: boolean;
        nextIsTemp: boolean;
    } | {
        nextRelativeMs: false;
        nextSkip: false;
        nextIsTemp: false;
    };
}
