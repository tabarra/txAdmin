//@ts-nocheck
import { test, expect, suite, it, vi, beforeAll, afterAll } from 'vitest';
import { FrameChunkAssembler, FramedChunkProcessor } from './fxsFrameUtils';
import ConsoleTransformer, { FORCED_EOL } from './ConsoleTransformer';
import ConsoleLineEnum from './ConsoleLineEnum';
import {
    buildFxsFramePrefix,
    buildTxFrameHeader,
    encodeFrameTs,
    parseFrameHeader,
    parseFxsFrameHeader,
    parseFxsRawFrameHeader,
    parseTxFrameHeader,
    renderFxsChannelBracket,
} from '@shared/consoleFrames';


//MARK: Fixtures
//Captured from a real gen9 build with output framing (ea-b0-output-framing), byte for byte
const RAW_LINES = [
    '\x1e1\x1f130\x1fserver-launcher\x1f\x1b[0mAdded packet pool info: min 7, max 263173, type 11, typeExtended 0\x1b[0m\n',
    '\x1e4\x1f60\x1fserver-config\x1f\x1b[0mServer config not found at none.cfg\x1b[0m\n',
    '\x1e1\x1f140\x1ffeature-handshake-server\x1f\x1b[0mGenerating hmac key.\x1b[0m\n',
    '\x1e2\x1f130\x1fserver-launcher\x1f\x1b[0mServer shutdown\x1b[0m\n',
];
const RAW_STREAM = RAW_LINES.join('');

//The same lines as printed by the same build without framing (timestamp replaced by a placeholder),
//minus the `[<level>]` bracket which txAdmin deliberately drops
const UNFRAMED_LINES = [
    '\x1b[36m[%TS%]\x1b[0m \x1b[38;5;130m[ server-launcher]\x1b[0m \x1b[0mAdded packet pool info: min 7, max 263173, type 11, typeExtended 0\x1b[0m\n',
    '\x1b[91m[%TS%]\x1b[0m \x1b[38;5;60m[   server-config]\x1b[0m \x1b[0mServer config not found at none.cfg\x1b[0m\n',
    '\x1b[36m[%TS%]\x1b[0m \x1b[38;5;140m[feature-handshak]\x1b[0m \x1b[0mGenerating hmac key.\x1b[0m\n',
    '\x1b[32m[%TS%]\x1b[0m \x1b[38;5;130m[ server-launcher]\x1b[0m \x1b[0mServer shutdown\x1b[0m\n',
];

const MOCK_TS = 1758500000;
const MOCK_TS_HEX = encodeFrameTs(MOCK_TS);
const MOCK_PREFIX = buildFxsFramePrefix(MOCK_TS_HEX);
const localTimeStr = (ts: number) => {
    const d = new Date(ts * 1000);
    const p = (n: number) => n.toString().padStart(2, '0');
    return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};
const MOCK_TS_STR = localTimeStr(MOCK_TS);
const injectTs = (raw: string) => raw.replaceAll('\x1e', MOCK_PREFIX);
const expectedUnframed = (i: number) => UNFRAMED_LINES[i].replace('%TS%', MOCK_TS_STR);
const EXPECTED_WEB_STREAM = injectTs(RAW_STREAM);
const EXPECTED_STDOUT_STREAM = UNFRAMED_LINES.map((_, i) => expectedUnframed(i)).join('');


//MARK: Shared parser
suite('parseFxsFrameHeader', () => {
    const valid = `\x1e${MOCK_TS_HEX}\x1f1\x1f130\x1fserver-launcher\x1fbody\n`;
    it('parses a valid header', () => {
        const res = parseFxsFrameHeader(valid);
        expect(res).toEqual({
            type: 'fxs',
            tsHex: MOCK_TS_HEX,
            level: 1,
            color: '130',
            channel: 'server-launcher',
            bodyStart: valid.indexOf('body'),
        });
    });
    it('parses at an offset', () => {
        const res = parseFxsFrameHeader('xxx' + valid, 3);
        expect(res?.channel).toEqual('server-launcher');
        expect(res?.bodyStart).toEqual(3 + valid.indexOf('body'));
    });
    it('accepts an empty color', () => {
        const res = parseFxsFrameHeader(`\x1e${MOCK_TS_HEX}\x1f2\x1f\x1fchan\x1fbody`);
        expect(res?.color).toEqual('');
        expect(res?.channel).toEqual('chan');
    });
    it('accepts a 64 char channel', () => {
        const chan = 'x'.repeat(64);
        const res = parseFxsFrameHeader(`\x1e${MOCK_TS_HEX}\x1f2\x1f1\x1f${chan}\x1fbody`);
        expect(res?.channel).toEqual(chan);
    });
    it('rejects an invalid first byte', () => {
        expect(parseFxsFrameHeader(valid.slice(1))).toBeNull();
    });
    it('rejects a non-hex timestamp', () => {
        expect(parseFxsFrameHeader(`\x1e0000zzzz\x1f1\x1f130\x1fchan\x1fbody`)).toBeNull();
        expect(parseFxsFrameHeader(`\x1e0000ABCD\x1f1\x1f130\x1fchan\x1fbody`)).toBeNull();
    });
    it('rejects a missing timestamp (raw fxserver header without injection)', () => {
        expect(parseFxsFrameHeader(RAW_LINES[0])).toBeNull();
    });
    it('rejects an out of range level', () => {
        expect(parseFxsFrameHeader(`\x1e${MOCK_TS_HEX}\x1f6\x1f130\x1fchan\x1fbody`)).toBeNull();
        expect(parseFxsFrameHeader(`\x1e${MOCK_TS_HEX}\x1fA\x1f130\x1fchan\x1fbody`)).toBeNull();
    });
    it('rejects a color that is too long or not numeric', () => {
        expect(parseFxsFrameHeader(`\x1e${MOCK_TS_HEX}\x1f1\x1f1300\x1fchan\x1fbody`)).toBeNull();
        expect(parseFxsFrameHeader(`\x1e${MOCK_TS_HEX}\x1f1\x1f1a\x1fchan\x1fbody`)).toBeNull();
    });
    it('rejects an empty or too long channel', () => {
        expect(parseFxsFrameHeader(`\x1e${MOCK_TS_HEX}\x1f1\x1f130\x1f\x1fbody`)).toBeNull();
        expect(parseFxsFrameHeader(`\x1e${MOCK_TS_HEX}\x1f1\x1f130\x1f${'x'.repeat(65)}\x1fbody`)).toBeNull();
    });
    it('rejects a channel spanning lines or records', () => {
        expect(parseFxsFrameHeader(`\x1e${MOCK_TS_HEX}\x1f1\x1f130\x1fch\nan\x1fbody`)).toBeNull();
        expect(parseFxsFrameHeader(`\x1e${MOCK_TS_HEX}\x1f1\x1f130\x1fch\x1ean\x1fbody`)).toBeNull();
    });
    it('rejects incomplete headers', () => {
        const full = `\x1e${MOCK_TS_HEX}\x1f1\x1f130\x1fserver-launcher\x1f`;
        for (let i = 0; i < full.length; i++) {
            expect(parseFxsFrameHeader(full.slice(0, i)), `cut at ${i}`).toBeNull();
        }
        expect(parseFxsFrameHeader(full)).not.toBeNull();
    });
});

suite('parseFxsRawFrameHeader', () => {
    it('parses the captured headers', () => {
        const res = parseFxsRawFrameHeader(RAW_LINES[2]);
        expect(res).toEqual({
            level: 1,
            color: '140',
            channel: 'feature-handshake-server',
            bodyStart: RAW_LINES[2].indexOf('\x1b[0m'),
        });
    });
    it('rejects the header with the timestamp injected', () => {
        expect(parseFxsRawFrameHeader(injectTs(RAW_LINES[0]))).toBeNull();
    });
    it('rejects incomplete headers', () => {
        const full = '\x1e1\x1f130\x1fserver-launcher\x1f';
        for (let i = 0; i < full.length; i++) {
            expect(parseFxsRawFrameHeader(full.slice(0, i)), `cut at ${i}`).toBeNull();
        }
        expect(parseFxsRawFrameHeader(full)).not.toBeNull();
    });
});

suite('parseTxFrameHeader', () => {
    it('parses all kinds', () => {
        for (const kind of ['A', 'S', 'I', 'E', 'L']) {
            const header = buildTxFrameHeader(MOCK_TS_HEX, kind, 'ctx');
            const res = parseTxFrameHeader(header + 'body');
            expect(res).toEqual({
                type: 'tx',
                tsHex: MOCK_TS_HEX,
                kind,
                context: 'ctx',
                bodyStart: header.length,
            });
        }
    });
    it('parses an empty context', () => {
        const header = buildTxFrameHeader(MOCK_TS_HEX, 'L');
        expect(parseTxFrameHeader(header + 'body')?.context).toEqual('');
    });
    it('accepts a 64 char context and rejects longer', () => {
        expect(parseTxFrameHeader(buildTxFrameHeader(MOCK_TS_HEX, 'A', 'x'.repeat(64)) + 'b')).not.toBeNull();
        expect(parseTxFrameHeader(buildTxFrameHeader(MOCK_TS_HEX, 'A', 'x'.repeat(65)) + 'b')).toBeNull();
    });
    it('rejects unknown kinds', () => {
        expect(parseTxFrameHeader(`\x1d${MOCK_TS_HEX}\x1fX\x1f\x1fbody`)).toBeNull();
        expect(parseTxFrameHeader(`\x1d${MOCK_TS_HEX}\x1f1\x1f\x1fbody`)).toBeNull();
    });
    it('rejects an fxs header', () => {
        expect(parseTxFrameHeader(injectTs(RAW_LINES[0]))).toBeNull();
    });
});

suite('parseFrameHeader', () => {
    it('dispatches by first byte', () => {
        expect(parseFrameHeader(injectTs(RAW_LINES[0]))?.type).toEqual('fxs');
        expect(parseFrameHeader(buildTxFrameHeader(MOCK_TS_HEX, 'I') + 'x')?.type).toEqual('tx');
        expect(parseFrameHeader('plain line')).toBeNull();
        expect(parseFrameHeader('')).toBeNull();
    });
});

suite('renderFxsChannelBracket', () => {
    it('matches gen9 formatting', () => {
        expect(renderFxsChannelBracket('server-launcher')).toEqual('[ server-launcher]');
        expect(renderFxsChannelBracket('feature-handshake-server')).toEqual('[feature-handshak]');
        expect(renderFxsChannelBracket('exactly16chars!!')).toEqual('[exactly16chars!!]');
        expect(renderFxsChannelBracket('a')).toEqual('[               a]');
    });
});


//MARK: Assembler
suite('FrameChunkAssembler', () => {
    it('passes through chunks without frames', () => {
        const a = new FrameChunkAssembler();
        expect(a.feed('hello\n')).toEqual('hello\n');
        expect(a.feed('')).toEqual('');
    });
    it('passes through complete records', () => {
        const a = new FrameChunkAssembler();
        expect(a.feed(RAW_STREAM)).toEqual(RAW_STREAM);
    });
    it('holds back a lone record separator', () => {
        const a = new FrameChunkAssembler();
        expect(a.feed('abc\n\x1e')).toEqual('abc\n');
        expect(a.feed(RAW_LINES[0].slice(1))).toEqual(RAW_LINES[0]);
    });
    it('does not hold back a long tail that is not a header', () => {
        const a = new FrameChunkAssembler();
        const chunk = '\x1e' + 'x'.repeat(100);
        expect(a.feed(chunk)).toEqual(chunk);
    });
    it('does not hold back a tail with a line break (stray separator in a body)', () => {
        const a = new FrameChunkAssembler();
        const chunk = '\x1e2\x1f1\x1fc\x1fhello\x1e\n';
        expect(a.feed(chunk)).toEqual(chunk);
        expect(a.feed('\x1e2\x1f1\x1fc\x1fhi\x1e\nmore')).toEqual('\x1e2\x1f1\x1fc\x1fhi\x1e\nmore');
    });
    it('is split-invariant at every position', () => {
        const ref = new FramedChunkProcessor().process(RAW_STREAM, MOCK_TS_HEX);
        for (let i = 0; i <= RAW_STREAM.length; i++) {
            const a = new FrameChunkAssembler();
            const p = new FramedChunkProcessor();
            const out1 = a.feed(RAW_STREAM.slice(0, i));
            const out2 = a.feed(RAW_STREAM.slice(i));
            expect(out1 + out2, `split at ${i}`).toEqual(RAW_STREAM);
            const r1 = p.process(out1, MOCK_TS_HEX);
            const r2 = p.process(out2, MOCK_TS_HEX);
            expect(r1.web + r2.web, `split at ${i}`).toEqual(ref.web);
            expect(r1.stdout + r2.stdout, `split at ${i}`).toEqual(ref.stdout);
        }
    });
    it('is split-invariant with three chunks', () => {
        const ref = new FramedChunkProcessor().process(RAW_STREAM, MOCK_TS_HEX);
        const len = RAW_STREAM.length;
        for (let i = 0; i <= len; i += 7) {
            for (let j = i; j <= len; j += 11) {
                const a = new FrameChunkAssembler();
                const p = new FramedChunkProcessor();
                const outs = [
                    a.feed(RAW_STREAM.slice(0, i)),
                    a.feed(RAW_STREAM.slice(i, j)),
                    a.feed(RAW_STREAM.slice(j)),
                ];
                expect(outs.join(''), `split at ${i},${j}`).toEqual(RAW_STREAM);
                const rs = outs.map(o => p.process(o, MOCK_TS_HEX));
                expect(rs.map(r => r.web).join(''), `split at ${i},${j}`).toEqual(ref.web);
                expect(rs.map(r => r.stdout).join(''), `split at ${i},${j}`).toEqual(ref.stdout);
            }
        }
    });
    it('resets pending data', () => {
        const a = new FrameChunkAssembler();
        expect(a.feed('\x1e1\x1f13')).toEqual('');
        a.reset();
        expect(a.feed('abc')).toEqual('abc');
    });
});


//MARK: Processor
suite('FramedChunkProcessor', () => {
    it('renders the captured lines: web gets the ts injected, stdout gets the unframed format', () => {
        const p = new FramedChunkProcessor();
        for (let i = 0; i < RAW_LINES.length; i++) {
            const res = p.process(RAW_LINES[i], MOCK_TS_HEX);
            expect(res.web, `line ${i}`).toEqual(injectTs(RAW_LINES[i]));
            expect(res.stdout, `line ${i}`).toEqual(expectedUnframed(i));
        }
    });
    it('renders a whole stream', () => {
        const p = new FramedChunkProcessor();
        const res = p.process(RAW_STREAM, MOCK_TS_HEX);
        expect(res.web).toEqual(EXPECTED_WEB_STREAM);
        expect(res.stdout).toEqual(EXPECTED_STDOUT_STREAM);
    });
    it('passes through text without frames', () => {
        const p = new FramedChunkProcessor();
        expect(p.process('plain\ntext\n', MOCK_TS_HEX)).toEqual({ web: 'plain\ntext\n', stdout: 'plain\ntext\n' });
        expect(p.process('', MOCK_TS_HEX)).toEqual({ web: '', stdout: '' });
    });
    it('passes through continuation lines', () => {
        const p = new FramedChunkProcessor();
        const res = p.process(RAW_LINES[3] + 'continuation\n', MOCK_TS_HEX);
        expect(res.web).toEqual(injectTs(RAW_LINES[3]) + 'continuation\n');
        expect(res.stdout).toEqual(expectedUnframed(3) + 'continuation\n');
    });
    it('drops stray record separators without injecting a timestamp', () => {
        const p = new FramedChunkProcessor();
        expect(p.process('abc\x1edef', MOCK_TS_HEX)).toEqual({ web: 'abcdef', stdout: 'abcdef' });
        const res = p.process(RAW_LINES[3].replace('Server', 'Ser\x1ever'), MOCK_TS_HEX);
        expect(res.web).toEqual(injectTs(RAW_LINES[3]));
        expect(res.stdout).toEqual(expectedUnframed(3));
        //long tail that bypasses the assembler holdback
        const long = '\x1e' + 'x'.repeat(73) + '\n';
        const res2 = p.process(RAW_LINES[3] + 'a' + long, MOCK_TS_HEX);
        expect(res2.web).toEqual(injectTs(RAW_LINES[3]) + 'a' + long.slice(1));
        expect(res2.stdout).toEqual(expectedUnframed(3) + 'a' + long.slice(1));
    });
    it('drops stray unit separators from bodies', () => {
        const p = new FramedChunkProcessor();
        expect(p.process('a\x1fb\n', MOCK_TS_HEX)).toEqual({ web: 'ab\n', stdout: 'ab\n' });
        const res = p.process('\x1e2\x1f1\x1fc\x1fa\x1fb\n', MOCK_TS_HEX);
        expect(res.web).toEqual(`${MOCK_PREFIX}2\x1f1\x1fc\x1fab\n`);
        expect(res.stdout).toEqual(`\x1b[32m[${MOCK_TS_STR}]\x1b[0m \x1b[38;5;1m[               c]\x1b[0m ab\n`);
        expect(res.stdout).not.toContain('\x1e');
        expect(res.stdout).not.toContain('\x1f');
    });
    it('never leaves separators in stdout for any input', () => {
        const p = new FramedChunkProcessor();
        const inputs = [
            '\x1e', '\x1f', '\x1e\x1f', '\x1e1\x1f', '\x1e1\x1f1\x1f', '\x1e1\x1f1\x1fc',
            '\x1e9\x1f1\x1fc\x1fbody', 'x\x1e\x1e\x1e2\x1f1\x1fc\x1f\x1f\x1fbody\x1e\n',
            RAW_STREAM.replaceAll('\n', '\x1f\n'),
        ];
        for (const input of inputs) {
            const res = p.process(input, MOCK_TS_HEX);
            expect(res.stdout, JSON.stringify(input)).not.toMatch(/[\x1e\x1f]/);
        }
    });
    it('renders an empty color without ansi codes', () => {
        const p = new FramedChunkProcessor();
        const res = p.process('\x1e2\x1f\x1fchan\x1fbody\n', MOCK_TS_HEX);
        expect(res.stdout).toEqual(`\x1b[32m[${MOCK_TS_STR}]\x1b[0m [            chan] body\n`);
    });
    it('renders all levels as a colored timestamp, without the level bracket', () => {
        const p = new FramedChunkProcessor();
        const seenColors = new Set<string>();
        for (let lvl = 0; lvl <= 5; lvl++) {
            const res = p.process(`\x1e${lvl}\x1f1\x1fc\x1fb\n`, MOCK_TS_HEX);
            const match = res.stdout.match(/^(\x1b\[[0-9;]+m)\[\d{2}:\d{2}:\d{2}\]\x1b\[0m \x1b\[38;5;1m\[ {15}c\]\x1b\[0m b\n$/);
            expect(match, `level ${lvl}`).not.toBeNull();
            seenColors.add(match![1]);
        }
        expect(seenColors.size).toEqual(6);
    });
    it('updates the timestamp when it changes', () => {
        const p = new FramedChunkProcessor();
        const ts2 = MOCK_TS + 61;
        const r1 = p.process(RAW_LINES[0], MOCK_TS_HEX);
        const r2 = p.process(RAW_LINES[0], encodeFrameTs(ts2));
        expect(r1.stdout).toContain(`[${MOCK_TS_STR}]`);
        expect(r1.web.startsWith(MOCK_PREFIX)).toBe(true);
        expect(r2.stdout).toContain(`[${localTimeStr(ts2)}]`);
        expect(r2.web.startsWith(buildFxsFramePrefix(encodeFrameTs(ts2)))).toBe(true);
    });
    it('survives the channel cache being full', () => {
        const p = new FramedChunkProcessor();
        for (let i = 0; i < 1200; i++) {
            p.process(`\x1e2\x1f1\x1fchan${i}\x1fb\n`, MOCK_TS_HEX);
        }
        expect(p.process(RAW_LINES[0], MOCK_TS_HEX).stdout).toEqual(expectedUnframed(0));
    });
});


//MARK: Transformer framed
suite('transformer: framed stdout', () => {
    beforeAll(() => { vi.spyOn(Date, 'now').mockReturnValue(MOCK_TS * 1000 + 123); });
    afterAll(() => { vi.restoreAllMocks(); });

    const getFramedTransformer = () => {
        const t = new ConsoleTransformer();
        t.isFramed = true;
        return t;
    };

    test('web gets the frame with the timestamp injected, stdout and file get the rendered line', () => {
        const t = getFramedTransformer();
        const res = t.process(ConsoleLineEnum.StdOut, RAW_STREAM);
        expect(res.webBuffer).toEqual(EXPECTED_WEB_STREAM);
        expect(res.stdoutBuffer).toEqual(EXPECTED_STDOUT_STREAM);
        expect(res.fileBuffer).toEqual(EXPECTED_STDOUT_STREAM);
        expect(t.lastEol).toEqual(true);
    });
    test('incomplete line then continuation', () => {
        const t = getFramedTransformer();
        const cut = RAW_LINES[0].length - 10;
        const res1 = t.process(ConsoleLineEnum.StdOut, RAW_LINES[0].slice(0, cut));
        expect(t.lastEol).toEqual(false);
        const res2 = t.process(ConsoleLineEnum.StdOut, RAW_LINES[0].slice(cut));
        expect(t.lastEol).toEqual(true);
        expect(res1.webBuffer + res2.webBuffer).toEqual(injectTs(RAW_LINES[0]));
        expect(res1.stdoutBuffer + res2.stdoutBuffer).toEqual(expectedUnframed(0));
    });
    test('forced eol when another source interrupts an incomplete line', () => {
        const t = getFramedTransformer();
        t.process(ConsoleLineEnum.MarkerInfo, 'incomplete');
        const res = t.process(ConsoleLineEnum.StdOut, RAW_LINES[0]);
        expect(res.webBuffer).toEqual(FORCED_EOL + injectTs(RAW_LINES[0]));
        expect(res.stdoutBuffer).toEqual(FORCED_EOL + expectedUnframed(0));
    });
    test('unframed transformer treats the same data as legacy stdout', () => {
        const t = new ConsoleTransformer();
        const line = 'plain line\n';
        const res = t.process(ConsoleLineEnum.StdOut, line);
        expect(res.webBuffer).toEqual(buildTxFrameHeader(MOCK_TS_HEX, 'L') + line);
        expect(res.stdoutBuffer).toEqual(line);
        expect(res.fileBuffer).toEqual(line);
    });
    test('resetFraming turns framing off', () => {
        const t = getFramedTransformer();
        t.resetFraming();
        expect(t.isFramed).toEqual(false);
    });
});
