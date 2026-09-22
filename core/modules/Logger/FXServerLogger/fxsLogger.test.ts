//@ts-nocheck
import { test, expect, suite, it, vi } from 'vitest';
import { prefixMultiline, splitFirstLine, stripLastEol } from './fxsLoggerUtils';
import ConsoleTransformer, { FORCED_EOL } from './ConsoleTransformer';
import ConsoleLineEnum from './ConsoleLineEnum';
import { buildTxFrameHeader, parseTxFrameHeader, type TxLineKindChar } from '@shared/consoleFrames';


//MARK: splitFirstLine
suite('splitFirstLine', () => {
    it('normal single full line', () => {
        const result = splitFirstLine('Hello\n');
        expect(result).toEqual({ first: 'Hello\n', rest: undefined, eol: true });
    });
    it('should split a string with a newline into two parts', () => {
        const result = splitFirstLine('Hello\nWorld');
        expect(result).toEqual({ first: 'Hello\n', rest: 'World', eol: false });
    });
    it('should return the whole string as the first part if there is no newline', () => {
        const result = splitFirstLine('HelloWorld');
        expect(result).toEqual({ first: 'HelloWorld', rest: undefined, eol: false });
    });
    it('should handle an empty string', () => {
        const result = splitFirstLine('');
        expect(result).toEqual({ first: '', rest: undefined, eol: false });
    });
    it('should handle multiple newlines correctly', () => {
        const result = splitFirstLine('Hello\nWorld\nAgain');
        expect(result).toEqual({ first: 'Hello\n', rest: 'World\nAgain', eol: false });
    });
    it('should handle CRLF at the end', () => {
        const result = splitFirstLine('Hello\r\n');
        expect(result).toEqual({ first: 'Hello\r\n', rest: undefined, eol: true });
    });
    it('should handle CRLF in the middle', () => {
        const result = splitFirstLine('Hello\r\nWorld\r\n');
        expect(result).toEqual({ first: 'Hello\r\n', rest: 'World\r\n', eol: true });
    });
    it('should handle CRLF at the start', () => {
        const result = splitFirstLine('\r\nbc\n');
        expect(result).toEqual({ first: '\r\n', rest: 'bc\n', eol: true });
    });
    it('should handle a newline at the start', () => {
        const result = splitFirstLine('\n\n');
        expect(result).toEqual({ first: '\n', rest: '\n', eol: true });
    });
});


//MARK: stripLastEol
suite('stripLastEol', () => {
    it('should strip \\r\\n from the end of the string', () => {
        const result = stripLastEol('Hello World\r\n');
        expect(result).toEqual({ str: 'Hello World', eol: '\r\n' });
    });

    it('should strip \\n from the end of the string', () => {
        const result = stripLastEol('Hello World\n');
        expect(result).toEqual({ str: 'Hello World', eol: '\n' });
    });

    it('should return the same string if there is no EOL character', () => {
        const result = stripLastEol('Hello World');
        expect(result).toEqual({ str: 'Hello World', eol: '' });
    });

    it('should return the same string if it ends with other characters', () => {
        const result = stripLastEol('Hello World!');
        expect(result).toEqual({ str: 'Hello World!', eol: '' });
    });
});


//MARK: prefixMultiline
suite('prefixMultiline', () => {
    it('should prefix every line in a multi-line string', () => {
        const result = prefixMultiline('Hello\nWorld\nAgain', '!!');
        expect(result).toBe('!!Hello\n!!World\n!!Again');
    });
    it('should prefix a single-line string', () => {
        const result = prefixMultiline('HelloWorld', '!!');
        expect(result).toBe('!!HelloWorld');
    });
    it('should handle an empty string', () => {
        const result = prefixMultiline('', '!!');
        expect(result).toBe('');
    });
    it('should handle a string with a newline at the end', () => {
        const result = prefixMultiline('Hello\n', '!!');
        expect(result).toBe('!!Hello\n');
    });
    it('should handle a string with multiple newlines at the end', () => {
        const result = prefixMultiline('Hello\nWorld\n\n', '!!');
        expect(result).toBe('!!Hello\n!!World\n!!\n');
    });
    it('should handle a string with newlines only', () => {
        const result = prefixMultiline('\n\n\n', '!!');
        expect(result).toBe('!!\n!!\n!!\n');
    });
    it('should handle a single newline', () => {
        const result = prefixMultiline('\n', '!!');
        expect(result).toBe('!!\n');
    });
    it('should handle a string with two full lines', () => {
        const result = prefixMultiline('test\nabcde\n', '!!');
        expect(result).toBe('!!test\n!!abcde\n');
    });
});



//MARK: Transformer parts
suite('transformer: prefixChunk', () => {
    const transformer = new ConsoleTransformer();
    test('shortcut stdout string', () => {
        const result = transformer.prefixChunk(ConsoleLineEnum.StdOut, 'xxxx\nxxx\n');
        expect(result.fileBuffer).toEqual('xxxx\nxxx\n');
    });
    test('empty string', () => {
        const result = transformer.prefixChunk(ConsoleLineEnum.StdOut, '');
        expect(result.fileBuffer).toEqual('');
    });
});


suite('transformer: timestamp', () => {
    test('0ms', () => {
        const transformer = new ConsoleTransformer();
        vi.spyOn(Date, 'now').mockReturnValue(0);
        transformer.refreshTs();
        expect(transformer.lastTs).toEqual(0);
        expect(transformer.tsHex).toEqual('00000000');
        vi.restoreAllMocks();
    });
    test('250ms', () => {
        const transformer = new ConsoleTransformer();
        vi.spyOn(Date, 'now').mockReturnValue(250);
        transformer.refreshTs();
        expect(transformer.lastTs).toEqual(0);
        expect(transformer.tsHex).toEqual('00000000');
        vi.restoreAllMocks();
    });
    test('1250ms', () => {
        const transformer = new ConsoleTransformer();
        vi.spyOn(Date, 'now').mockReturnValue(1250);
        transformer.refreshTs();
        expect(transformer.lastTs).toEqual(1);
        expect(transformer.tsHex).toEqual('00000001');
        vi.restoreAllMocks();
    });
    test('real timestamp', () => {
        const transformer = new ConsoleTransformer();
        vi.spyOn(Date, 'now').mockReturnValue(1758500000123);
        transformer.refreshTs();
        expect(transformer.lastTs).toEqual(1758500000);
        expect(transformer.tsHex).toEqual((1758500000).toString(16));
        expect(transformer.legacyStdOutHeader).toEqual(`\x1d${transformer.tsHex}\x1fL\x1f\x1f`);
        vi.restoreAllMocks();
    });
});

//MARK: Transformer ingest
const jp = (arr: string[]) => arr.join('');
//NOTE: reading the ts from the transformer itself avoids a race at the second boundary
const txHeader = (t: ConsoleTransformer, kind: TxLineKindChar, context = '') => buildTxFrameHeader(t.tsHex, kind, context);
const getPatchedTransformer = () => {
    const t = new ConsoleTransformer();
    t.STYLES = {
        [ConsoleLineEnum.StdOut]: null,
        [ConsoleLineEnum.StdErr]: { web: {} },
        [ConsoleLineEnum.MarkerAdminCmd]: { web: {} },
        [ConsoleLineEnum.MarkerSystemCmd]: { web: {} },
        [ConsoleLineEnum.MarkerInfo]: { web: {} },
    };
    t.PREFIX_SYSTEM = '-';
    t.PREFIX_STDERR = '-';
    return t;
}
suite('transformer: source', () => {
    suite('incomplete', () => {
        test('StdOut', () => {
            const transformer = getPatchedTransformer();
            transformer.lastEol = false;
            transformer.process(ConsoleLineEnum.StdOut, 'x');
            expect(transformer.lastSrc).toEqual('0:undefined');
        });
        test('StdErr', () => {
            const transformer = getPatchedTransformer();
            transformer.lastEol = false;
            transformer.process(ConsoleLineEnum.StdErr, 'x');
            expect(transformer.lastSrc).toEqual('1:undefined');
        });
    });
    suite('no context', () => {
        test('StdOut', () => {
            const transformer = getPatchedTransformer();
            transformer.process(ConsoleLineEnum.StdOut, 'x');
            expect(transformer.lastSrc).toEqual('0:undefined');
        });
        test('StdErr', () => {
            const transformer = getPatchedTransformer();
            transformer.process(ConsoleLineEnum.StdErr, 'x');
            expect(transformer.lastSrc).toEqual('1:undefined');
        });
    });
    suite('context', () => {
        test('StdOut', () => {
            const transformer = getPatchedTransformer();
            transformer.process(ConsoleLineEnum.StdOut, 'x', 'y');
            expect(transformer.lastSrc).toEqual('0:y');
        });
        test('StdErr', () => {
            const transformer = getPatchedTransformer();
            transformer.process(ConsoleLineEnum.StdErr, 'x', 'y');
            expect(transformer.lastSrc).toEqual('1:y');
        });
    });
});
suite('transformer: shortcuts', () => {
    test('empty string', () => {
        const transformer = getPatchedTransformer();
        const result = transformer.process(ConsoleLineEnum.StdOut, '');
        expect(result.webBuffer).toEqual('');
    });
    test('\\n', () => {
        const transformer = getPatchedTransformer();
        const result = transformer.process(ConsoleLineEnum.StdErr, '\n');
        expect(result.webBuffer).toEqual('\n');
    });
    test('\\r\\n', () => {
        const transformer = getPatchedTransformer();
        const result = transformer.process(ConsoleLineEnum.StdErr, '\r\n');
        expect(result.webBuffer).toEqual('\n');
    });
});

suite('transformer: new line', () => {
    test('single line same src', () => {
        const transformer = getPatchedTransformer();
        const result = transformer.process(ConsoleLineEnum.StdOut, 'test');
        expect(result.webBuffer).toEqual(jp([txHeader(transformer, 'L'), 'test']));
        expect(result.stdoutBuffer).toEqual('test');
        expect(result.fileBuffer).toEqual('test');
        expect(transformer.lastEol).toEqual(false);
    });
    test('single line diff src', () => {
        const transformer = getPatchedTransformer();
        const result = transformer.process(ConsoleLineEnum.StdErr, 'test');
        expect(result.webBuffer).toEqual(jp([txHeader(transformer, 'E'), '- ', 'test']));
        expect(transformer.lastEol).toEqual(false);
    });
    test('multi line same src', () => {
        const transformer = getPatchedTransformer();
        const result = transformer.process(ConsoleLineEnum.StdOut, 'test\ntest2');
        const header = txHeader(transformer, 'L');
        expect(result.webBuffer).toEqual(jp([header, 'test\n', header, 'test2']));
        expect(result.stdoutBuffer).toEqual('test\ntest2');
        expect(transformer.lastEol).toEqual(false);
    });
    test('multi line diff src', () => {
        const transformer = getPatchedTransformer();
        const result = transformer.process(ConsoleLineEnum.StdErr, 'test\ntest2');
        const header = txHeader(transformer, 'E');
        expect(result.webBuffer).toEqual(jp([header, '- ', 'test\n', header, '- ', 'test2']));
        expect(transformer.lastEol).toEqual(false);
    });
    test('admin command carries the author as context', () => {
        const transformer = getPatchedTransformer();
        const result = transformer.process(ConsoleLineEnum.MarkerAdminCmd, 'cmd\n', 'tabarra');
        const header = txHeader(transformer, 'A', 'tabarra');
        expect(result.webBuffer).toEqual(jp([header, '║             tabarra║ ', 'cmd\n']));
        expect(result.stdoutBuffer).toEqual('');
        expect(result.fileBuffer).toEqual('║             tabarra║ cmd\n');
    });
    test('admin command context is sanitized', () => {
        const transformer = getPatchedTransformer();
        const result = transformer.process(ConsoleLineEnum.MarkerAdminCmd, 'cmd\n', 'ta\x1fba\nrra');
        expect(result.webBuffer.startsWith(txHeader(transformer, 'A', 'tabarra'))).toBe(true);
    });
    test('styled lines keep the header at column zero', () => {
        //using the real styles, which apply colors to the whole line
        const transformer = new ConsoleTransformer();
        const result = transformer.process(ConsoleLineEnum.MarkerInfo, 'line1\nline2\n');
        const header = txHeader(transformer, 'I');
        const lines = result.webBuffer.split('\n');
        expect(lines.length).toEqual(3);
        expect(lines[0].startsWith(header)).toBe(true);
        expect(lines[1].startsWith(header)).toBe(true);
        expect(lines[2]).toEqual('');
    });
});


suite('transformer: postfix', () => {
    test('same source incomplete line', () => {
        const transformer = getPatchedTransformer();
        transformer.lastEol = false;
        const result = transformer.process(ConsoleLineEnum.StdOut, 'test');
        expect(result.webBuffer).toEqual(jp(['test']));
        expect(transformer.lastEol).toEqual(false);
    });
    test('same source complete line', () => {
        const transformer = getPatchedTransformer();
        transformer.lastEol = false;
        const result = transformer.process(ConsoleLineEnum.StdOut, 'test\n');
        expect(result.webBuffer).toEqual(jp(['test\n']));
        expect(transformer.lastEol).toEqual(true);
    });
    test('same source multi line', () => {
        const transformer = getPatchedTransformer();
        transformer.lastEol = false;
        const result = transformer.process(ConsoleLineEnum.StdOut, 'test\nxx\n');
        expect(result.webBuffer).toEqual(jp(['test\n', txHeader(transformer, 'L'), 'xx\n']));
        expect(result.stdoutBuffer).toEqual('test\nxx\n');
        expect(transformer.lastEol).toEqual(true);
    });

    test('diff source incomplete line', () => {
        const transformer = getPatchedTransformer();
        transformer.lastEol = false;
        const result = transformer.process(ConsoleLineEnum.StdErr, 'test');
        expect(result.webBuffer).toEqual(jp([FORCED_EOL, txHeader(transformer, 'E'), '- ', 'test']));
        expect(transformer.lastEol).toEqual(false);
    });
    test('diff source complete line', () => {
        const transformer = getPatchedTransformer();
        transformer.lastEol = false;
        const result = transformer.process(ConsoleLineEnum.StdErr, 'test\n');
        expect(result.webBuffer).toEqual(jp([FORCED_EOL, txHeader(transformer, 'E'), '- ', 'test\n']));
        expect(transformer.lastEol).toEqual(true);
    });
    test('diff source multi line', () => {
        const transformer = getPatchedTransformer();
        transformer.lastEol = false;
        const result = transformer.process(ConsoleLineEnum.StdErr, 'test\nabcde\n');
        const header = txHeader(transformer, 'E');
        expect(result.webBuffer).toEqual(jp([FORCED_EOL, header, '- ', 'test\n', header, '- ', 'abcde\n']));
        expect(transformer.lastEol).toEqual(true);
    });
    test('same source CRLF continuation keeps the header at line start', () => {
        const transformer = getPatchedTransformer();
        transformer.process(ConsoleLineEnum.StdOut, 'a');
        const result = transformer.process(ConsoleLineEnum.StdOut, '\r\nbc\n');
        expect(result.webBuffer).toEqual(jp(['\r\n', txHeader(transformer, 'L'), 'bc\n']));
        expect(result.stdoutBuffer).toEqual('\r\nbc\n');
        expect(transformer.lastEol).toEqual(true);
    });
    test('same source continuation does not drop a blank line', () => {
        const transformer = getPatchedTransformer();
        transformer.process(ConsoleLineEnum.StdOut, 'a');
        const result = transformer.process(ConsoleLineEnum.StdOut, '\n\n');
        expect(result.webBuffer).toEqual(jp(['\n', txHeader(transformer, 'L'), '\n']));
        expect(result.stdoutBuffer).toEqual('\n\n');
        expect(result.fileBuffer).toEqual('\n\n');
        expect(transformer.lastEol).toEqual(true);
    });
});


suite('transformer: channel width', () => {
    test('defaults to the gen8 width', () => {
        const transformer = new ConsoleTransformer();
        expect(transformer.PREFIX_SYSTEM).toEqual('║             TXADMIN║');
        const result = transformer.process(ConsoleLineEnum.MarkerAdminCmd, 'cmd\n', 'tabarra');
        expect(result.fileBuffer).toEqual('║             tabarra║ cmd\n');
    });
    test('gen9 width aligns with the 16 char channel bracket', () => {
        const transformer = new ConsoleTransformer({ channelWidth: 16 });
        expect(transformer.PREFIX_SYSTEM).toEqual('║         TXADMIN║');
        expect(transformer.PREFIX_STDERR).toEqual('║          STDERR║');
        const result = transformer.process(ConsoleLineEnum.MarkerAdminCmd, 'cmd\n', 'tabarra');
        expect(result.fileBuffer).toEqual('║         tabarra║ cmd\n');
        expect(result.fileBuffer.indexOf(' cmd')).toEqual('[ server-launcher]'.length);
    });
});


suite('transformer: header integrity', () => {
    test('admin command context is truncated to the protocol limit', () => {
        const transformer = getPatchedTransformer();
        const longName = 'a'.repeat(80);
        const result = transformer.process(ConsoleLineEnum.MarkerAdminCmd, 'cmd\n', longName);
        const header = txHeader(transformer, 'A', 'a'.repeat(64));
        expect(result.webBuffer.startsWith(header)).toBe(true);
        expect(parseTxFrameHeader(result.webBuffer)).not.toBeNull();
    });
    test('real chalk styles keep the header at column zero and the final newline', () => {
        const transformer = new ConsoleTransformer();
        for (const type of [ConsoleLineEnum.StdErr, ConsoleLineEnum.MarkerAdminCmd, ConsoleLineEnum.MarkerSystemCmd, ConsoleLineEnum.MarkerInfo]) {
            const result = transformer.process(type, 'a\nb\n', 'ctx');
            const lines = result.webBuffer.split('\n');
            expect(lines.length, `type ${type}`).toEqual(3);
            expect(parseTxFrameHeader(lines[0]), `type ${type} line 0`).not.toBeNull();
            expect(parseTxFrameHeader(lines[1]), `type ${type} line 1`).not.toBeNull();
            expect(lines[2], `type ${type}`).toEqual('');
            expect(result.webBuffer.endsWith('\n')).toBe(true);
        }
    });
});
