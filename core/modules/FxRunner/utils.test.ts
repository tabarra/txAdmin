import { suite, it, expect, test } from 'vitest';
import { sanitizeConsoleArgString, stringifyConsoleArgs } from './utils';

const fxsArgsParser = (str: string) => {
    const args: string[] = [];
    let current = ''
    let inQuotes = false
    for (let i = 0; i < str.length; i++) {
        const char = str[i]
        if (char === '\\' && i + 1 < str.length && str[i + 1] === '"') {
            current += '"'
            i++
            continue
        }
        if (char === '"') {
            inQuotes = !inQuotes
            continue
        }
        if (/\s/.test(char) && !inQuotes) {
            if (current.length) {
                args.push(current)
                current = ''
            }
            continue
        }
        //test for semicolon - if odd number of escaped double quotes
        //NOTE: you can escape " but not a \
        if (char === ';') {
            if (inQuotes) {
                const escapedQuotes = current.match(/(?<!\\)"/g)?.length ?? 0;
                if (escapedQuotes % 2 === 1) throw new Error('command');
            } else {
                throw new Error('command');
            }
        }
        current += char
    }
    args.push(current);

    return args;
}

//Check against empirical data
test('fxsArgsParser', () => {
    expect(fxsArgsParser('')).toEqual(['']);
    expect(fxsArgsParser('a')).toEqual(['a']);
    expect(fxsArgsParser('ab')).toEqual(['ab']);

    expect(fxsArgsParser('a b')).toEqual(['a', 'b']);
    expect(fxsArgsParser('"a b"')).toEqual(['a b']);
    expect(fxsArgsParser('"a b\\"')).toEqual(['a b"']);
    expect(fxsArgsParser('"a b')).toEqual(['a b']);
    expect(fxsArgsParser('"a\\ b"')).toEqual(['a\\ b']);
    expect(fxsArgsParser('"a\\" b"')).toEqual(['a" b']);
    expect(fxsArgsParser('"a\\"\\" b"')).toEqual(['a"" b']);
    expect(fxsArgsParser('"a;b"')).toEqual(['a;b']);

    expect(fxsArgsParser('"a\\b"')).toEqual(['a\\b']);
    expect(fxsArgsParser('"a\\\\b"')).toEqual(['a\\\\b']);

    expect(fxsArgsParser('"a;b;c"')).toEqual(['a;b;c']);
    expect(() => fxsArgsParser('"a\\";b;c"')).toThrow(); //cmd b + cmd c
    expect(() => fxsArgsParser('"a;b\\";c"')).toThrow(); //cmd c only

    expect(() => fxsArgsParser('a;b')).toThrow(); //cmd
    expect(() => fxsArgsParser('"a\\";b"')).toThrow(); //cmd
    expect(fxsArgsParser('"a\\"\\";b"')).toEqual(['a"";b']);
    expect(fxsArgsParser('"a;\\"b"')).toEqual(['a;"b']);
    expect(fxsArgsParser('"a;\\"\\"b"')).toEqual(['a;""b']);
    expect(() => fxsArgsParser('"a\\";\\"b"')).toThrow(); //cmd
    expect(fxsArgsParser('"a\\"\\";\\"b"')).toEqual(['a"";"b']);
    expect(() => fxsArgsParser('"a\\"\\"\\";b"')).toThrow(); //cmd

    //testing separators
    expect(fxsArgsParser('a')).toEqual(['a']);
    expect(fxsArgsParser('a.b')).toEqual(['a.b']);
    expect(fxsArgsParser('a,b')).toEqual(['a,b']);
    expect(fxsArgsParser('a!b')).toEqual(['a!b']);
    expect(fxsArgsParser('a-b')).toEqual(['a-b']);
    expect(fxsArgsParser('a_b')).toEqual(['a_b']);
    expect(fxsArgsParser('a:b')).toEqual(['a:b']);
    expect(fxsArgsParser('a^b')).toEqual(['a^b']);
    expect(fxsArgsParser('a~b')).toEqual(['a~b']);
});


suite('sanitizeConsoleArgString', () => {
    it('should throw for non-strings', () => {
        //@ts-expect-error
        expect(() => sanitizeConsoleArgString()).toThrow();
        //@ts-expect-error
        expect(() => sanitizeConsoleArgString(123)).toThrow();
        //@ts-expect-error
        expect(() => sanitizeConsoleArgString([])).toThrow();
        //@ts-expect-error
        expect(() => sanitizeConsoleArgString({})).toThrow();
        //@ts-expect-error
        expect(() => sanitizeConsoleArgString(null)).toThrow();
    });

    it('should correctly stringify simple strings', () => {
        expect(sanitizeConsoleArgString('')).toBe('');
        expect(sanitizeConsoleArgString('test')).toBe('test');
        expect(sanitizeConsoleArgString('aa bb')).toBe('aa bb');
    });
    it('should correctly handle strings with double quotes', () => {
        expect(sanitizeConsoleArgString('te"st')).toBe('te"st');
        expect(sanitizeConsoleArgString('"quoted"')).toBe('"quoted"');
    });
    it('should handle semicolons', () => {
        expect(sanitizeConsoleArgString(';')).toBe('\u037e');
        expect(sanitizeConsoleArgString('a;b')).toBe('a\u037eb');
    });
});


suite('stringifyConsoleArgs', () => {
    suite('string args', () => {
        it('should correctly stringify simple strings', () => {
            expect(stringifyConsoleArgs([''])).toEqual('""');
            expect(stringifyConsoleArgs(['test'])).toEqual('"test"');
            expect(stringifyConsoleArgs(['aa bb'])).toEqual('"aa bb"');
        });
        it('should correctly handle strings with double quotes', () => {
            expect(stringifyConsoleArgs(['te"st'])).toEqual('"te\\"st"');
            expect(stringifyConsoleArgs(['"quoted"'])).toEqual('"\\"quoted\\""');
        });
        it('should handle semicolons', () => {
            expect(stringifyConsoleArgs([';'])).toEqual('"\u037e"');
            expect(stringifyConsoleArgs(['a;b'])).toEqual('"a\u037eb"');
        });
    });

    suite('non-string arg', () => {
        //The decoder mimics fxserver + lua behavior
        const nonStringDecoder = (str: string) => {
            const args = fxsArgsParser(str);
            if (!args.length) throw new Error('no args');
            const cleanedUp = args[0].replaceAll('\u037e', ';');
            return JSON.parse(cleanedUp);
        }
        const both = (input: any) => nonStringDecoder(stringifyConsoleArgs([input]));

        it('should correctly stringify numbers', () => {
            expect(both(123)).toEqual(123);
            expect(both(123.456)).toEqual(123.456);
        });
        it('should correctly handle simple objects', () => {
            expect(both({ a: true })).toEqual({ a: true });
            expect(both({ a: true, b: "bb", c: 123 })).toEqual({ a: true, b: "bb", c: 123 });
            expect(both({ a: { test: true } })).toEqual({ a: { test: true } });
        });
        it('should correctly handle gotcha objects', () => {
            expect(both({ a: 'aa"bb' })).toEqual({ a: 'aa"bb' });
            expect(both({ a: 'aa;bb' })).toEqual({ a: 'aa;bb' });
        });
    });

});
