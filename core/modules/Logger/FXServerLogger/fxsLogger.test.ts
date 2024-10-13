//@ts-nocheck
import '@extras/testEnv';
import { test, expect, suite, it, vitest, vi } from 'vitest';
import { prefixMultiline, splitFirstLine, stripLastEol } from './fxsLoggerUtils';
import ConsoleTransformer, { FORCED_EOL } from './ConsoleTransformer';
import { ConsoleLineType } from '.';


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
    it('should handle a string with two full lines', () => {
        const result = prefixMultiline('test\nabcde\n', '!!');
        expect(result).toBe('!!test\n!!abcde\n');
    });
});



//MARK: Transformer parts
suite('transformer: prefixChunk', () => {
    const transformer = new ConsoleTransformer();
    test('shortcut stdout string', () => {
        const result = transformer.prefixChunk(ConsoleLineType.StdOut, 'xxxx\nxxx\n');
        expect(result.fileBuffer).toEqual('xxxx\nxxx\n');
    });
    test('empty string', () => {
        const result = transformer.prefixChunk(ConsoleLineType.StdOut, '');
        expect(result.fileBuffer).toEqual('');
    });
});


suite('transformer: marker', () => {
    test('0ms delay', () => {
        const transformer = new ConsoleTransformer();
        vi.spyOn(Date, 'now').mockReturnValue(0);
        const res = transformer.getTimeMarker();
        expect(res).toBe('');
        expect(transformer.lastMarkerTs).toEqual(0);
        vi.restoreAllMocks();
    });
    test('250ms delay', () => {
        const transformer = new ConsoleTransformer();
        vi.spyOn(Date, 'now').mockReturnValue(250);
        const res = transformer.getTimeMarker();
        expect(res).toBe('');
        expect(transformer.lastMarkerTs).toEqual(0);
        vi.restoreAllMocks();
    });
    test('1250ms delay', () => {
        const transformer = new ConsoleTransformer();
        vi.spyOn(Date, 'now').mockReturnValue(1250);
        const res = transformer.getTimeMarker();
        expect(res).toBeTruthy();
        expect(transformer.lastMarkerTs).toEqual(1);
        vi.restoreAllMocks();
    });
    test('2250ms delay', () => {
        const transformer = new ConsoleTransformer();
        vi.spyOn(Date, 'now').mockReturnValue(2250);
        const res = transformer.getTimeMarker();
        expect(res).toBeTruthy();
        expect(transformer.lastMarkerTs).toEqual(2);
        vi.restoreAllMocks();
    });
});

//MARK: Transformer ingest
const jp = (arr: string[]) => arr.join('');
const getPatchedTransformer = () => {
    const t = new ConsoleTransformer();
    t.STYLES = {
        [ConsoleLineType.StdOut]: null,
        [ConsoleLineType.StdErr]: { web: {} },
        [ConsoleLineType.MarkerAdminCmd]: { web: {} },
        [ConsoleLineType.MarkerSystemCmd]: { web: {} },
        [ConsoleLineType.MarkerInfo]: { web: {} },
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
            transformer.process(ConsoleLineType.StdOut, 'x');
            expect(transformer.lastSrc).toEqual('0:undefined');
        });
        test('StdErr', () => {
            const transformer = getPatchedTransformer();
            transformer.lastEol = false;
            transformer.process(ConsoleLineType.StdErr, 'x');
            expect(transformer.lastSrc).toEqual('1:undefined');
        });
    });
    suite('no context', () => {
        test('StdOut', () => {
            const transformer = getPatchedTransformer();
            transformer.process(ConsoleLineType.StdOut, 'x');
            expect(transformer.lastSrc).toEqual('0:undefined');
        });
        test('StdErr', () => {
            const transformer = getPatchedTransformer();
            transformer.process(ConsoleLineType.StdErr, 'x');
            expect(transformer.lastSrc).toEqual('1:undefined');
        });
    });
    suite('context', () => {
        test('StdOut', () => {
            const transformer = getPatchedTransformer();
            transformer.process(ConsoleLineType.StdOut, 'x', 'y');
            expect(transformer.lastSrc).toEqual('0:y');
        });
        test('StdErr', () => {
            const transformer = getPatchedTransformer();
            transformer.process(ConsoleLineType.StdErr, 'x', 'y');
            expect(transformer.lastSrc).toEqual('1:y');
        });
    });
});
suite('transformer: shortcuts', () => {
    test('empty string', () => {
        const transformer = getPatchedTransformer();
        const result = transformer.process(ConsoleLineType.StdOut, '');
        expect(result.webBuffer).toEqual('');
    });
    test('\\n', () => {
        const transformer = getPatchedTransformer();
        const result = transformer.process(ConsoleLineType.StdErr, '\n');
        expect(result.webBuffer).toEqual('\n');
    });
    test('\\r\\n', () => {
        const transformer = getPatchedTransformer();
        const result = transformer.process(ConsoleLineType.StdErr, '\r\n');
        expect(result.webBuffer).toEqual('\n');
    });
});

suite('transformer: new line', () => {
    const expectedTimeMarker = `{§${Math.floor(Date.now() / 1000).toString(16)}}`;

    test('single line same src', () => {
        const transformer = getPatchedTransformer();
        const result = transformer.process(ConsoleLineType.StdOut, 'test');
        expect(result.webBuffer).toEqual(jp([expectedTimeMarker, 'test']));
        expect(transformer.lastEol).toEqual(false);
    });
    test('single line diff src', () => {
        const transformer = getPatchedTransformer();
        const result = transformer.process(ConsoleLineType.StdErr, 'test');
        expect(result.webBuffer).toEqual(jp([expectedTimeMarker, '- ', 'test']));
        expect(transformer.lastEol).toEqual(false);
    });
    test('multi line same src', () => {
        const transformer = getPatchedTransformer();
        const result = transformer.process(ConsoleLineType.StdOut, 'test\ntest2');
        expect(result.webBuffer).toEqual(jp([expectedTimeMarker, 'test\ntest2']));
        expect(transformer.lastEol).toEqual(false);
    });
    test('multi line diff src', () => {
        const transformer = getPatchedTransformer();
        const result = transformer.process(ConsoleLineType.StdErr, 'test\ntest2');
        expect(result.webBuffer).toEqual(jp([expectedTimeMarker, '- ', 'test\n', '- ', 'test2']));
        expect(transformer.lastEol).toEqual(false);
    });
});


suite('transformer: postfix', () => {
    const expectedTimeMarker = `{§${Math.floor(Date.now() / 1000).toString(16)}}`;

    test('same source incomplete line', () => {
        const transformer = getPatchedTransformer();
        transformer.lastEol = false;
        const result = transformer.process(ConsoleLineType.StdOut, 'test');
        expect(result.webBuffer).toEqual(jp(['test']));
        expect(transformer.lastEol).toEqual(false);
    });
    test('same source complete line', () => {
        const transformer = getPatchedTransformer();
        transformer.lastEol = false;
        const result = transformer.process(ConsoleLineType.StdOut, 'test\n');
        expect(result.webBuffer).toEqual(jp(['test\n']));
        expect(transformer.lastEol).toEqual(true);
    });
    test('same source multi line', () => {
        const transformer = getPatchedTransformer();
        transformer.lastEol = false;
        const result = transformer.process(ConsoleLineType.StdOut, 'test\nxx\n');
        // console.dir(result); return;
        expect(result.webBuffer).toEqual(jp(['test\n', expectedTimeMarker, 'xx\n']));
        expect(transformer.lastEol).toEqual(true);
    });

    test('diff source incomplete line', () => {
        const transformer = getPatchedTransformer();
        transformer.lastEol = false;
        const result = transformer.process(ConsoleLineType.StdErr, 'test');
        expect(result.webBuffer).toEqual(jp([FORCED_EOL, expectedTimeMarker, '- ', 'test']));
        expect(transformer.lastEol).toEqual(false);
    });
    test('diff source complete line', () => {
        const transformer = getPatchedTransformer();
        transformer.lastEol = false;
        const result = transformer.process(ConsoleLineType.StdErr, 'test\n');
        expect(result.webBuffer).toEqual(jp([FORCED_EOL, expectedTimeMarker, '- ', 'test\n']));
        expect(transformer.lastEol).toEqual(true);
    });
    test('diff source multi line', () => {
        const transformer = getPatchedTransformer();
        transformer.lastEol = false;
        const result = transformer.process(ConsoleLineType.StdErr, 'test\nabcde\n');
        expect(result.webBuffer).toEqual(jp([FORCED_EOL, expectedTimeMarker, '- ', 'test\n', '- ', 'abcde\n']));
        expect(transformer.lastEol).toEqual(true);
    });
});
