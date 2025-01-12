import { z } from "zod";
import { ConfigScope, ListOf } from "./utils";
import general from "./general";
import fxRunner from "./fxRunner";
import restarter from "./restarter";
import banlist from "./banlist";
import whitelist from "./whitelist";
import discordBot from "./discordBot";
import gameFeatures from "./gameFeatures";
import webServer from "./webServer";


//Type inference utils
type InferConfigScopes<S extends ConfigScope> = IferConfigValues<S>;
type IferConfigValues<S extends ConfigScope> = {
    [K in keyof S]: S[K]['default'] | z.infer<S[K]['validator']>;
};

//Exporting the schemas
export const ConfigSchemas_v2 = {
    general,
    fxRunner,
    restarter,
    banlist,
    whitelist,
    discordBot,
    gameFeatures,
    webServer,
} satisfies ListOf<ConfigScope>;

//Exporting the types
export type TxConfigScopes = keyof typeof ConfigSchemas_v2;
export type TxConfigs = {
    [K in TxConfigScopes]: InferConfigScopes<typeof ConfigSchemas_v2[K]>
};
export type PartialTxConfigs = {
    [K in TxConfigScopes]: Partial<InferConfigScopes<typeof ConfigSchemas_v2[K]>>
};

//Allow unknown scopes/keys
export type ConfigScaffold = ListOf<ListOf<any>>;
export type StoredTxConfigs = PartialTxConfigs & ConfigScaffold;
export type ConfigFileData = PartialTxConfigs & { version: number };
