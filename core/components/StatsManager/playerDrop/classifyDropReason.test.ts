import '@extras/testEnv';
import { expect, it, suite } from 'vitest';
import { classifyDropReason } from './classifyDropReason';
import { PDL_CRASH_REASON_CHAR_LIMIT, PDL_UNKNOWN_REASON_CHAR_LIMIT } from './config';


const userInitiatedExamples = [
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
    `Fetching info timed out.`,
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
const exceptionExamples = [
    `Unhandled exception: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`,
    `Exceção não tratada: %s`,
];


suite('classifyDropReason', () => {
    const fnc = classifyDropReason;
    it('should handle invalid reasons', () => {
        expect(fnc(undefined as any)).toEqual({ category: 'unknown' });
        expect(fnc('')).toEqual({ category: 'unknown' });
        expect(fnc('   ')).toEqual({ category: 'unknown' });
    });
    it('should classify user-initiated reasons', () => {
        for (const reason of userInitiatedExamples) {
            expect(fnc(reason).category).toBe('user-initiated');
        }
    });
    it('should classify server-initiated reasons', () => {
        for (const reason of serverInitiatedExamples) {
            expect(fnc(reason).category).toBe('server-initiated');
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
        for (const reason of [...crashExamples, ...exceptionExamples]) {
            expect(fnc(reason).category).toBe('crash');
        }
    });
    it('should translate crash reasons', () => {
        for (const reason of [...crashExamples, ...exceptionExamples]) {
            const resp = fnc(reason);
            expect(resp.cleanReason).toBeTypeOf('string');
            expect(resp.cleanReason).toSatisfy((x: string) => {
                return x.startsWith('Game crashed: ') || x.startsWith('Unhandled exception: ')
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
