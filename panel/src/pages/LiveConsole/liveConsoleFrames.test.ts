import { expect, it, suite } from "vitest";
import { extractTermLineHeader, filterTermLine, formatFxsLinePrefix, sanitizeTermLine } from "./liveConsoleUtils";
import { buildFxsFramePrefix, buildTxFrameHeader, encodeFrameTs } from "@shared/consoleFrames";

const TS = 1758500000;
const TS_HEX = encodeFrameTs(TS);
//Captured from a real gen9 build with output framing, with the timestamp injected by core
const FXS_LINE = buildFxsFramePrefix(TS_HEX) + '1\x1f130\x1fserver-launcher\x1f\x1b[0mAdded packet pool info\x1b[0m';
const FXS_BODY = '\x1b[0mAdded packet pool info\x1b[0m';

suite('extractTermLineHeader', () => {
    it('extracts an fxserver header', () => {
        const { header, content } = extractTermLineHeader(FXS_LINE);
        expect(header).toMatchObject({
            type: 'fxs',
            ts: TS,
            level: 1,
            color: '130',
            channel: 'server-launcher',
        });
        expect(content).toEqual(FXS_BODY);
    });
    it('extracts a txAdmin header', () => {
        const body = '║             tabarra║ cmd';
        const { header, content } = extractTermLineHeader(buildTxFrameHeader(TS_HEX, 'A', 'tabarra') + body);
        expect(header).toMatchObject({
            type: 'tx',
            ts: TS,
            kind: 'A',
            context: 'tabarra',
        });
        expect(content).toEqual(body);
    });
    it('returns the line as is when there is no header', () => {
        expect(extractTermLineHeader('continuation')).toEqual({ header: null, content: 'continuation' });
        expect(extractTermLineHeader('')).toEqual({ header: null, content: '' });
    });
    it('returns the line as is when the header is broken', () => {
        const broken = '\x1e' + TS_HEX + '\x1f9\x1f130\x1fchan\x1fbody';
        expect(extractTermLineHeader(broken)).toEqual({ header: null, content: broken });
    });
});

suite('formatFxsLinePrefix', () => {
    it('renders the channel like gen9 does, without the level', () => {
        expect(formatFxsLinePrefix('130', 'server-launcher'))
            .toEqual('\x1b[38;5;130m[ server-launcher]\x1b[0m ');
        expect(formatFxsLinePrefix('60', 'server-config'))
            .toEqual('\x1b[38;5;60m[   server-config]\x1b[0m ');
        expect(formatFxsLinePrefix('130', 'feature-handshake-server'))
            .toEqual('\x1b[38;5;130m[feature-handshak]\x1b[0m ');
    });
    it('renders an empty color without ansi codes', () => {
        expect(formatFxsLinePrefix('', 'chan')).toEqual('[            chan] ');
    });
    it('returns the same string from the cache', () => {
        const a = formatFxsLinePrefix('130', 'server-launcher');
        const b = formatFxsLinePrefix('130', 'server-launcher');
        expect(a).toBe(b);
    });
});

suite('filterTermLine with gen9 prefix', () => {
    const rendered = sanitizeTermLine('12:34:56 ' + formatFxsLinePrefix('130', 'server-launcher') + 'hello');
    it('keeps everything when both options are on', () => {
        expect(filterTermLine(rendered, true, true)).toEqual(rendered);
    });
    it('removes the channel tag when copyTag is off', () => {
        expect(filterTermLine(rendered, true, false)).toEqual('12:34:56 hello');
    });
    it('removes the timestamp when copyTimestamp is off', () => {
        expect(filterTermLine(rendered, false, true)).toEqual('[ server-launcher] hello');
    });
    it('removes both', () => {
        expect(filterTermLine(rendered, false, false)).toEqual('hello');
    });
    it('still handles the gen8 tag', () => {
        expect(filterTermLine('12:34:56 [             TXADMIN] hello', true, false)).toEqual('12:34:56 hello');
    });
});
