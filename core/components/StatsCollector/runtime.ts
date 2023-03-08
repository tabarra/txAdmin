type SimpleCounter = unknown;
type MultipleCounter = unknown;
type LimitedArray = unknown;
type QuantileArray = {
    count: number;
    q5: number;
    q25: number;
    q50: number;
    q75: number;
    q95: number;
};

/*
- [x] fix broken runtime stats
- [x] if ptero
- [x] how many scheduled restart times
- [ ] drop zap/discord as login methods
- [x] HWID: `count, q1, q25, q50, q75, q99`.
*/

type RuntimeDataType = {
    //static
    txAdminPort: number;
    isZapHosting: boolean;
    isPterodactyl: boolean; //check if proc.env.TXADMIN_ENABLE exists
    osDistro: string;
    hostCpuModel: string;
    hostTotalMemory: string;

    //dynamic
    fxServerBootSeconds: number; //NOTE: just last one
    deploymentType: string; //NOTE: recipe name or "local"
    banCheckingEnabled: boolean;
    svMainHitchesIn30h: number | undefined;
    medianPlayersIn30h: number | undefined;
    
    adminCount: number;
    whitelistMode: string; //NOTE: 'disabled' | 'adminOnly' | 'guildMember' | 'guildRoles' | 'approvedLicense'
    playerDb: {
        players: number;
        playTime: number;
        whitelists: number;
        bans: number;
        warns: number;
    },
    
    //Runtime counters
    botCommands: MultipleCounter | undefined;
    menuCommands: MultipleCounter | undefined;
    pageViews: MultipleCounter;
    loginOrigins: MultipleCounter;
    loginMethods: MultipleCounter;
    tmpHwidsCount: QuantileArray; //NOTE: only read if tmpHwidsCount.count >= 2000
}

//FIXME: http counter > keep max counter only
