import { z } from "zod";
import { ConfigScope, ListOf } from "./utils";
import general from "./general";
import server from "./server";
import restarter from "./restarter";
import banlist from "./banlist";
import whitelist from "./whitelist";
import discordBot from "./discordBot";
import gameFeatures from "./gameFeatures";
import webServer from "./webServer";
import logger from "./logger";


//Type inference utils
type InferConfigScopes<S extends ConfigScope> = IferConfigValues<S>;
type IferConfigValues<S extends ConfigScope> = {
    [K in keyof S]: S[K]['default'] | z.infer<S[K]['validator']>;
};

//Exporting the schemas
export const ConfigSchemas_v2 = {
    general,
    server,
    restarter,
    banlist,
    whitelist,
    discordBot,
    gameFeatures,
    webServer,
    logger,
} satisfies ListOf<ConfigScope>;

//Exporting the types
export type TxConfigScopes = keyof typeof ConfigSchemas_v2;
export type TxConfigs = {
    [K in TxConfigScopes]: InferConfigScopes<typeof ConfigSchemas_v2[K]>
};
export type PartialTxConfigs = Partial<{
    [K in TxConfigScopes]: Partial<InferConfigScopes<typeof ConfigSchemas_v2[K]>>
}>;
export type ConfigFileData = PartialTxConfigs & { version: number };

//Allow unknown scopes/keys
export type ConfigScaffold = ListOf<ListOf<any>>;
