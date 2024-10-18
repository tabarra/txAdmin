//FIXME: after refactor, move to the correct path
import type { ReleaseType } from 'semver';

type RolloutStrategyType = {
    pct: number,
    delay: number
}[];


/**
 * Returns the delay in days for the update rollout based on the release type and the dice roll.
 */
export const getUpdateRolloutDelay = (
    releaseDiff: ReleaseType,
    isCurrentPreRelease: boolean,
    diceRoll: number,
): number => {
    //Sanity check diceRoll
    if (diceRoll < 0 || diceRoll > 100) {
        return 0;
    }

    let rolloutStrategy: RolloutStrategyType;
    if (isCurrentPreRelease) {
        // If you are on beta, it's probably really important to update immediately
        rolloutStrategy = [
            { pct: 100, delay: 0 },
        ];
    } else if (releaseDiff === 'major') {
        //   5% immediate rollout
        //  20% after 2 days
        // 100% after 7 days
        rolloutStrategy = [
            { pct: 5, delay: 0 },
            { pct: 15, delay: 2 },
            { pct: 80, delay: 7 },
        ];
    } else if (releaseDiff === 'minor') {
        //  10% immediate rollout
        //  40% after 2 day
        // 100% after 4 days
        rolloutStrategy = [
            { pct: 10, delay: 0 },
            { pct: 30, delay: 2 },
            { pct: 60, delay: 4 },
        ];
    } else if (releaseDiff === 'patch') {
        // Immediate rollout to everyone, probably correcting bugs
        rolloutStrategy = [
            { pct: 100, delay: 0 },
        ];
    } else {
        // Update notification from stable to pre-release should not happen, delay 7 days
        rolloutStrategy = [
            { pct: 100, delay: 7 },
        ];
    }

    // Implement strategy based on diceRoll
    let cumulativePct = 0;
    for (const tier of rolloutStrategy) {
        cumulativePct += tier.pct;
        if (diceRoll <= cumulativePct) {
            return tier.delay;
        }
    }

    // Default delay if somehow no tier is matched (which shouldn't happen)
    return 0;
};
