//FIXME: after refactor, move to the correct path (maybe drop the 'update' prefix?)
const modulename = 'UpdateChecker';
import semver, { ReleaseType } from 'semver';
import { z } from "zod";
import got from '@core/extras/got.js';
import { txEnv } from '@core/globalData';
import consoleFactory from '@extras/console';
import { UpdateDataType } from '@shared/otherTypes';
import TxAdmin from '@core/txAdmin';
import { UpdateAvailableEventType } from '@shared/socketioTypes';
const console = consoleFactory(modulename);


//Schemas
const txVersion = z.string().refine(
    (x) => x !== '0.0.0',
    { message: 'must not be 0.0.0' }
);
const changelogRespSchema = z.object({
    recommended: z.coerce.number().positive(),
    recommended_download: z.string().url(),
    recommended_txadmin: txVersion,
    optional: z.coerce.number().positive(),
    optional_download: z.string().url(),
    optional_txadmin: txVersion,
    latest: z.coerce.number().positive(),
    latest_download: z.string().url(),
    latest_txadmin: txVersion,
    critical: z.coerce.number().positive(),
    critical_download: z.string().url(),
    critical_txadmin: txVersion,
});

//Types
type DetailedUpdateDataType = {
    semverDiff: ReleaseType;
    version: string;
    isImportant: boolean;
};

export const queryChangelogApi = async () => {
    //GET changelog data
    let apiResponse: z.infer<typeof changelogRespSchema>;
    try {
        //perform request - cache busting every ~1.4h
        const osTypeApiUrl = (txEnv.isWindows) ? 'win32' : 'linux';
        const cacheBuster = Math.floor(Date.now() / 5_000_000);
        const reqUrl = `https://changelogs-live.fivem.net/api/changelog/versions/${osTypeApiUrl}/server?${cacheBuster}`;
        const resp = await got(reqUrl).json()
        apiResponse = changelogRespSchema.parse(resp);
    } catch (error) {
        console.verbose.warn(`Failed to retrieve FXServer/txAdmin update data with error: ${(error as Error).message}`);
        return;
    }

    //Checking txAdmin version
    let txaUpdateData: DetailedUpdateDataType | undefined;
    try {
        const isOutdated = semver.lt(txEnv.txAdminVersion, apiResponse.latest_txadmin);
        if (isOutdated) {
            const semverDiff = semver.diff(txEnv.txAdminVersion, apiResponse.latest_txadmin) ?? 'patch';
            const isImportant = (semverDiff === 'major' || semverDiff === 'minor');
            txaUpdateData = {
                semverDiff,
                isImportant,
                version: apiResponse.latest_txadmin,
            };
        }
    } catch (error) {
        console.verbose.warn('Error checking for txAdmin updates.');
        console.verbose.dir(error);
    }

    //Checking FXServer version
    let fxsUpdateData: UpdateDataType | undefined;
    try {
        if (txEnv.fxServerVersion < apiResponse.critical) {
            if (apiResponse.critical > apiResponse.recommended) {
                fxsUpdateData = {
                    version: apiResponse.critical.toString(),
                    isImportant: true,
                }
            } else {
                fxsUpdateData = {
                    version: apiResponse.recommended.toString(),
                    isImportant: true,
                }
            }
        } else if (txEnv.fxServerVersion < apiResponse.recommended) {
            fxsUpdateData = {
                version: apiResponse.recommended.toString(),
                isImportant: true,
            };
        } else if (txEnv.fxServerVersion < apiResponse.optional) {
            fxsUpdateData = {
                version: apiResponse.optional.toString(),
                isImportant: false,
            };
        }
    } catch (error) {
        console.warn('Error checking for FXServer updates.');
        console.verbose.dir(error);
    }

    return {
        txa: txaUpdateData,
        fxs: fxsUpdateData,
    };
};
