//FIXME: after refactor, move to the correct path
import { it, expect, suite } from 'vitest';
import { getUpdateRolloutDelay } from './updateRollout';

suite('getReleaseRolloutDelay', () => {
    const fnc = getUpdateRolloutDelay;

    it('should handle invalid input', () => {
        expect(fnc('minor', false, -1)).toBe(0);
        expect(fnc('minor', false, 150)).toBe(0);
        expect(fnc('aaaaaaa' as any, false, 5)).toBe(7);
    });

    it('should return 0 delay for 100% immediate pre-release update', () => {
        expect(fnc('minor', true, 0)).toBe(0);
        expect(fnc('minor', true, 50)).toBe(0);
        expect(fnc('minor', true, 100)).toBe(0);
        expect(fnc('major', true, 0)).toBe(0);
        expect(fnc('major', true, 50)).toBe(0);
        expect(fnc('major', true, 100)).toBe(0);
        expect(fnc('patch', true, 0)).toBe(0);
        expect(fnc('patch', true, 50)).toBe(0);
        expect(fnc('patch', true, 100)).toBe(0);
        expect(fnc('prepatch', true, 0)).toBe(0);
        expect(fnc('prepatch', true, 50)).toBe(0);
        expect(fnc('prepatch', true, 100)).toBe(0);
    });

    it('should return correct delay for major release based on dice roll', () => {
        // First tier (5%)
        let delay = fnc('major', false, 3);
        expect(delay).toBe(0);

        // Second tier (5% < x <= 20%)
        delay = fnc('major', false, 10);
        expect(delay).toBe(2);

        // Third tier (remaining 80%)
        delay = fnc('major', false, 50);
        expect(delay).toBe(7);
    });

    it('should return correct delay for minor release based on dice roll', () => {
        // First tier (10%)
        let delay = fnc('minor', false, 5);
        expect(delay).toBe(0);

        // Second tier (10% < x <= 40%)
        delay = fnc('minor', false, 20);
        expect(delay).toBe(2);

        // Third tier (remaining 60%)
        delay = fnc('minor', false, 80);
        expect(delay).toBe(4);
    });

    it('should return 0 delay for patch release for all dice rolls', () => {
        const delay = fnc('patch', false, 50);
        expect(delay).toBe(0);
    });

    it('should return 7-day delay for stable to pre-release', () => {
        const delay = fnc('prerelease', false, 50);
        expect(delay).toBe(7);
    });
});
