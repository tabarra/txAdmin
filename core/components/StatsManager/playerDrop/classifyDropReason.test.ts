//@ts-nocheck
import '@extras/testEnv';
import { expect, it, suite } from 'vitest';
import { classifyDrop } from './classifyDropReason';
import { PDL_CRASH_REASON_CHAR_LIMIT, PDL_UNKNOWN_REASON_CHAR_LIMIT } from './config';


const playerInitiatedExamples = [
    `Exiting`,
    `Quit: safasdfsadfasfd`,
    `Entering Rockstar Editor`,
    `Could not find requested level (%s) - loaded the default level instead.`,
    `Reloading game.`,
    `Reconnecting`,
    `Connecting to another server.`,
    `Disconnected.`,
];
const serverInitiatedExamples = [
    `Disconnected by server: %s`,
    `Server shutting down: %s`,
    `[txAdmin] Server restarting (scheduled restart at 03:00).`, //not so sure about this
];
const timeoutExamples = [
    `Server->client connection timed out. Pending commands: %d.\nCommand list:\n%s`,
    `Server->client connection timed out. Last seen %d msec ago.`,
    `Connection timed out.`,
    `Timed out after 60 seconds (1, %d)`,
    `Timed out after 60 seconds (2)`,
];
const securityExamples = [
    `Unreliable network event overflow.`,
    `Reliable server command overflow.`,
    `Reliable network event overflow.`,
    `Reliable network event size overflow: %s`,
    `Reliable state bag packet overflow.`,
    `Connection to CNL timed out.`,
    `Server Command Overflow`,
    `Invalid Client configuration. Restart your Game and reconnect.`,
]
const crashExamples = [
    `Game crashed: Recursive error: An exception occurred (c0000005 at 0x7ff6bb17f1c9) during loading of resources:/cars/data/[limiteds]/xmas 4/carvariations.meta in data file mounter 0x141a22350. The game will be terminated.`,
    `O jogo crashou: %s`,
];
const crashExceptionExamples = [
    `Game crashed: Unhandled exception: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`,
    `Game crashed: Exceção não tratada: %s`,
];


suite('classifyDrop legacy mode', () => {
    const fnc = (reason: string) => classifyDrop({
        type: 'txAdminPlayerlistEvent',
        event: 'playerDropped',
        id: 0,
        reason,
    });
    it('should handle invalid reasons', () => {
        expect(fnc(undefined as any)).toEqual({
            category: 'unknown',
            cleanReason: '[tx:invalid-reason]',
        });
        expect(fnc('')).toEqual({
            category: 'unknown',
            cleanReason: '[tx:empty-reason]',
        });
        expect(fnc('   ')).toEqual({
            category: 'unknown',
            cleanReason: '[tx:empty-reason]',
        });
    });
    it('should classify player-initiated reasons', () => {
        for (const reason of playerInitiatedExamples) {
            expect(fnc(reason).category).toBe('player');
        }
    });
    it('should classify server-initiated reasons', () => {
        for (const reason of serverInitiatedExamples) {
            expect(fnc(reason).category).toBe(false);
        }
    });
    it('should classify timeout reasons', () => {
        for (const reason of timeoutExamples) {
            expect(fnc(reason).category).toBe('timeout');
        }
    });
    it('should classify security reasons', () => {
        for (const reason of securityExamples) {
            expect(fnc(reason).category).toBe('security');
        }
    });
    it('should classify crash reasons', () => {
        for (const reason of [...crashExamples, ...crashExceptionExamples]) {
            expect(fnc(reason).category).toBe('crash');
        }
    });
    it('should translate crash exceptions', () => {
        for (const reason of [...crashExceptionExamples]) {
            const resp = fnc(reason);
            expect(resp.cleanReason).toBeTypeOf('string');
            expect(resp.cleanReason).toSatisfy((x: string) => {
                return x.startsWith('Unhandled exception: ')
            });
        }
    });
    it('should handle long crash reasons', () => {
        const resp = fnc(crashExamples[0] + 'a'.repeat(1000));
        expect(resp.cleanReason).toBeTypeOf('string');
        expect(resp.cleanReason!.length).toBe(PDL_CRASH_REASON_CHAR_LIMIT);
    });
    it('should handle unknown reasons', () => {
        const resp = fnc('a'.repeat(1000));
        expect(resp.cleanReason).toBeTypeOf('string');
        expect(resp.cleanReason!.length).toBe(PDL_UNKNOWN_REASON_CHAR_LIMIT);
        expect(resp.category).toBe('unknown');
    });
});


suite('classifyDrop new mode', () => {
    const fnc = (reason: string, resource: string, category: number) => classifyDrop({
        type: 'txAdminPlayerlistEvent',
        event: 'playerDropped',
        id: 0,
        reason,
        category,
        resource,
    });
    it('should handle invalid categories', () => {
        expect(fnc('rsn', 'res', null)).toEqual({
            category: 'unknown',
            cleanReason: '[tx:invalid-category] rsn',
        });
        expect(fnc('rsn', 'res', -1)).toEqual({
            category: 'unknown',
            cleanReason: '[tx:invalid-category] rsn',
        });
        expect(fnc('rsn', 'res', 999)).toEqual({
            category: 'unknown',
            cleanReason: '[tx:unknown-category] rsn',
        });
    });

    it('should handle the resource category', () => {
        expect(fnc('rsn', 'res', 1)).toEqual({
            category: 'resource',
            resource: 'res',
        });
        expect(fnc('rsn', '', 1)).toEqual({
            category: 'resource',
            resource: 'unknown',
        });
        expect(fnc('rsn', 'monitor', 1)).toEqual({
            category: 'resource',
            resource: 'txAdmin',
        });
        expect(fnc('server_shutting_down', 'monitor', 1)).toEqual({
            category: false,
        });
    });
    it('should handle the client category', () => {
        expect(fnc('rsn', 'res', 2)).toEqual({
            category: 'player',
        });
        expect(fnc(crashExamples[0], 'res', 2).category).toEqual('crash');
    });
    it('should handle the timeout category', () => {
        expect(fnc('rsn', 'res', 5)).toEqual({category: 'timeout'});
        expect(fnc('rsn', 'res', 6)).toEqual({category: 'timeout'});
        expect(fnc('rsn', 'res', 12)).toEqual({category: 'timeout'});
    });
    it('should handle the security category', () => {
        expect(fnc('rsn', 'res', 3)).toEqual({category: 'security'});
        expect(fnc('rsn', 'res', 4)).toEqual({category: 'security'});
        expect(fnc('rsn', 'res', 8)).toEqual({category: 'security'});
        expect(fnc('rsn', 'res', 9)).toEqual({category: 'security'});
        expect(fnc('rsn', 'res', 10)).toEqual({category: 'security'});
        expect(fnc('rsn', 'res', 11)).toEqual({category: 'security'});
    });
    it('should handle the shutdown category', () => {
        expect(fnc('rsn', 'res', 7)).toEqual({category: false});
    });
});
