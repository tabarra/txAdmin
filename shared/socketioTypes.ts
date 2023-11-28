export type GlobalStatusType = {
    discord: false | number;
    server: {
        mutex: string | null;
        status: string;
        process: string;
        instantiated: boolean;
        name: string;
        whitelist: "disabled" | "adminOnly" | "guildMember" | "guildRoles" | "approvedLicense";
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
