import { expect, it, suite } from "vitest";
import { filterTermLine, formatTermTimestamp, sanitizeTermLine } from "./liveConsoleUtils";

suite('filterTermLine', () => {
    const fnc: typeof filterTermLine = (input, opts) => filterTermLine(sanitizeTermLine(input), opts);
    const baseOpts = {
        copyTimestamp: true,
        copyTag: true,
        timestampDisabled: false,
        timestampForceHour12: false,
    };

    const exampleLines = {
        empty: '',
        info: '[             TXADMIN] ================================================================ ',
        resGroup: '[resources:[builders]] Warning: [builders]x does not have a resource manifest (fxmanifest.lua)',
        input: '[             tabarra] dd ',
        normal: '[           resources] Scanning resources.',
        normal2: '[                 cmd] No such command dd.',
        normal3: '[ citizen-server-main] Warning: The players.json endpoint has been modified',
    };

    suite('timestamp formats', () => {
        it('should handle 24-hour format when timestampForceHour12 is false', () => {
            const opts = { ...baseOpts, timestampForceHour12: false };
            const ts = 14 * 3600; // 14:00:00
            const input = formatTermTimestamp(ts, opts) + exampleLines.normal;
            expect(fnc(input, opts)).toEqual(sanitizeTermLine(input));
        });

        it('should handle 12-hour format when timestampForceHour12 is true', () => {
            const opts = { ...baseOpts, timestampForceHour12: true };
            const ts = 14 * 3600; // 2:00:00 PM
            const input = formatTermTimestamp(ts, opts) + exampleLines.normal;
            expect(fnc(input, opts)).toEqual(sanitizeTermLine(input));
        });
    });

    suite('copyTimestamp and copyTag options', () => {
        it('should return full line when copyTimestamp and copyTag are true', () => {
            const opts = { ...baseOpts, copyTimestamp: true, copyTag: true };
            const ts = 10 * 3600; // 10:00:00 AM
            const input = formatTermTimestamp(ts, opts) + exampleLines.input;
            expect(fnc(input, opts)).toEqual(sanitizeTermLine(input)); // Corrected expectation
        });

        it('should remove timestamp when copyTimestamp is false', () => {
            const opts = { ...baseOpts, copyTimestamp: false, copyTag: true };
            const ts = 10 * 3600; // 10:00:00 AM
            const input = formatTermTimestamp(ts, baseOpts) + exampleLines.input;
            const expected = exampleLines.input.trimEnd();
            expect(fnc(input, opts)).toEqual(expected); // Corrected expectation
        });

        it('should remove tag when copyTag is false', () => {
            const opts = { ...baseOpts, copyTimestamp: true, copyTag: false };
            const ts = 0;
            const input = formatTermTimestamp(ts, opts) + exampleLines.input;
            const timestamp = formatTermTimestamp(ts, opts);
            const expected = timestamp + 'dd';
            expect(fnc(input, opts)).toEqual(sanitizeTermLine(expected));
        });

        it('should remove both timestamp and tag when both copyTimestamp and copyTag are false', () => {
            const opts = { ...baseOpts, copyTimestamp: false, copyTag: false };
            const ts = 0;
            const content = 'whatever';
            const input = formatTermTimestamp(ts, baseOpts) + content;
            expect(fnc(input, opts)).toEqual(content);
        });
    });

    suite('handling empty and various lines', () => {
        it('should handle empty line', () => {
            const opts = { ...baseOpts };
            const input = '';
            expect(fnc(input, opts)).toEqual('');
        });

        it('should handle line without timestamp', () => {
            const opts = { ...baseOpts };
            const input = exampleLines.normal;
            expect(fnc(input, opts)).toEqual(exampleLines.normal);
        });
    });

    suite('AM/PM formatting', () => {
        it('should correctly filter AM time when copyTimestamp is true', () => {
            const opts = { ...baseOpts, timestampForceHour12: true, copyTimestamp: true, copyTag: true };
            const ts = 5 * 3600; // 5:00:00 AM
            const input = formatTermTimestamp(ts, opts) + exampleLines.normal;
            expect(fnc(input, opts)).toEqual(sanitizeTermLine(input)); // Ensures full line is returned
        });

        it('should correctly filter PM time when copyTimestamp is false', () => {
            const opts = { ...baseOpts, timestampForceHour12: true, copyTimestamp: false, copyTag: true };
            const ts = 17 * 3600; // 5:00:00 PM
            const input = formatTermTimestamp(ts, opts) + exampleLines.normal;
            const expected = exampleLines.normal;
            expect(fnc(input, opts)).toEqual(expected); // Ensures timestamp is removed
        });
    });

    suite('comprehensive example tests', () => {
        it('should handle all example lines with base options', () => {
            const opts = { ...baseOpts };
            for (const [key, input] of Object.entries(exampleLines)) {
                const sanitized = sanitizeTermLine(input);
                expect(fnc(input, opts)).toEqual(sanitized);
            }
        });
    });
});
