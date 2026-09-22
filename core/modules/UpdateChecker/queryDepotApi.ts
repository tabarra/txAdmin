const modulename = 'UpdateChecker';
import { z } from "zod";
import got from '@lib/got';
import { txEnv } from '@core/globalData';
import consoleFactory from '@lib/console';
import { UpdateDataType } from '@shared/otherTypes';
import { fromError } from 'zod-validation-error';
const console = consoleFactory(modulename);


//Schema - the response also contains content_files, but we only care about the build
const depotRespSchema = z.object({
    build: z.coerce.number().positive(),
});


/**
 * Queries the Cfx Depot API for the latest FXServer Gen9 build.
 * Until the depot exposes txAdmin meta fields, this checks fxserver only.
 * 
 * TODO: the depot will soon expose the txAdmin version as a meta field for the fxserver endpoint,
 * at which point this should also take over the txAdmin update check.
 */
export const queryGen9DepotApi = async () => {
    //FIXME: Depot has different channels for branches, but it's not one-to-one with the --runtime-branch arg
    //for instance "early-access" is "main" while "feat/csharp-improvements" is "csharp_improvements"
    //so for now we hardcode it as main
    const channel = 'main';

    //GET depot data
    let latestBuild: number;
    try {
        //perform request - cache busting every ~1.4h
        const cacheBuster = Math.floor(Date.now() / 5_000_000);
        const resp = await got(`https://depot.cfx.re/public/p/fxserver_gen9/u/${channel}?${cacheBuster}`).json();
        latestBuild = depotRespSchema.parse(resp).build;
    } catch (error) {
        let msg = (error as Error).message;
        if (error instanceof z.ZodError) {
            msg = fromError(error, { prefix: null }).message;
        }
        console.verbose.warn(`Failed to retrieve FXServer update data from depot channel '${channel}' with error: ${msg}`);
        return;
    }

    //Checking FXServer version
    //Since Depot doesn't have recommended/optional/etc, we just assume it's important since it's early access anyways
    let fxsUpdateData: UpdateDataType | undefined;
    if (txEnv.fxsVersion < latestBuild) {
        fxsUpdateData = {
            version: latestBuild.toString(),
            isImportant: true,
        };
    }

    return {
        txa: undefined,
        fxs: fxsUpdateData,
    };
};
