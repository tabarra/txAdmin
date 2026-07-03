import { parseCoordsString } from '@lib/misc';

/**
 * Returns the jail enforcement environment (bucket + positions) from the config,
 * used in the playerJailed event and the pendingJail initial data payloads.
 */
export const getJailEnvironment = () => {
    return {
        bucket: txConfig.gameFeatures.jailRoutingBucket,
        posFivem: parseCoordsString(txConfig.gameFeatures.jailPosFivem),
        posRedm: parseCoordsString(txConfig.gameFeatures.jailPosRedm),
    };
};
