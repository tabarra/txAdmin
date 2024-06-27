const modulename = 'UpdateChecker';
import semver from 'semver';
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


export default class UpdateChecker {
    #txAdmin: TxAdmin;
    txaUpdateData?: UpdateDataType;
    fxsUpdateData?: UpdateDataType;

    constructor(txAdmin: TxAdmin) {
        this.#txAdmin = txAdmin;

        //Check for updates ASAP
        this.checkChangelog();

        //Check again every 15 mins
        setInterval(() => {
            this.checkChangelog();
        }, 15 * 60_000);
    }


    /**
     * Check for txAdmin and FXServer updates
     */
    async checkChangelog() {
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
        try {
            const isOutdated = semver.lt(txEnv.txAdminVersion, apiResponse.latest_txadmin);
            if (isOutdated) {
                const semverDiff = semver.diff(txEnv.txAdminVersion, apiResponse.latest_txadmin);
                if (semverDiff === 'patch') {
                    console.warn('This version of txAdmin is outdated.');
                    console.warn('A patch (bug fix) update is available for txAdmin.');
                    console.warn('If you are experiencing any kind of issue, please update now.');
                    console.warn('For more information: https://discord.gg/uAmsGa2');
                    this.txaUpdateData = {
                        version: apiResponse.latest_txadmin,
                        isImportant: false,
                    };
                } else {
                    console.error('This version of txAdmin is outdated.');
                    console.error('Please update as soon as possible.');
                    console.error('For more information: https://discord.gg/uAmsGa2');
                    this.txaUpdateData = {
                        version: apiResponse.latest_txadmin,
                        isImportant: true,
                    };
                }
            }
        } catch (error) {
            console.verbose.warn('Error checking for txAdmin updates. Enable verbosity for more information.');
            console.verbose.dir(error);
        }

        //Checking FXServer version
        try {
            if (txEnv.fxServerVersion < apiResponse.critical) {
                if (apiResponse.critical > apiResponse.recommended) {
                    this.fxsUpdateData = {
                        version: apiResponse.critical.toString(),
                        isImportant: true,
                    }
                } else {
                    this.fxsUpdateData = {
                        version: apiResponse.recommended.toString(),
                        isImportant: true,
                    }
                }
            } else if (txEnv.fxServerVersion < apiResponse.recommended) {
                this.fxsUpdateData = {
                    version: apiResponse.recommended.toString(),
                    isImportant: true,
                };
            } else if (txEnv.fxServerVersion < apiResponse.optional) {
                this.fxsUpdateData = {
                    version: apiResponse.optional.toString(),
                    isImportant: false,
                };
            }
        } catch (error) {
            console.warn('Error checking for FXServer updates. Enable verbosity for more information.');
            console.verbose.dir(error);
        }

        //Sending event to the UI
        if (this.txaUpdateData || this.fxsUpdateData) {
            this.#txAdmin.webServer.webSocket.pushEvent<UpdateAvailableEventType>('updateAvailable', {
                fxserver: this.fxsUpdateData,
                txadmin: this.txaUpdateData,
            });
        }
    }
};

/*
    TODO:
    Create an page with the changelog, that queries for the following endpoint and caches it for 15 minutes:
        https://changelogs-live.fivem.net/api/changelog/versions/2385/2375?tag=server
    Maybe even grab the data from commits:
        https://changelogs-live.fivem.net/api/changelog/versions/5562
    Other relevant apis:
        https://changelogs-live.fivem.net/api/changelog/versions/win32/server? (the one being used below)
        https://changelogs-live.fivem.net/api/changelog/versions
        https://api.github.com/repos/tabarra/txAdmin/releases (changelog in [].body)

    NOTE: old logic
    if == recommended, you're fine
    if > recommended && < optional, pls update to optional
    if == optional, you're fine
    if > optional && < latest, pls update to latest
    if == latest, duh
    if < critical, BIG WARNING
*/
