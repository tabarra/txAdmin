import { test, expect, suite, it } from 'vitest';
import * as misc from './misc';


suite('parseSchedule', () => {
    it('should parse a valid schedule', () => {
        const result = misc.parseSchedule(['00:00', '00:15', '12:30', '1:30']);
        expect(result.valid).toEqual([
            { string: '00:00', hours: 0, minutes: 0 },
            { string: '00:15', hours: 0, minutes: 15 },
            { string: '12:30', hours: 12, minutes: 30 },
            { string: '01:30', hours: 1, minutes: 30 },
        ]);
        expect(result.invalid).toEqual([]);
    });

    it('should let the average american type 24:00', () => {
        const result = misc.parseSchedule(['24:00']);
        expect(result.valid).toEqual([
            { string: '00:00', hours: 0, minutes: 0 },
        ]);
        expect(result.invalid).toEqual([]);
    });

    it('should handle invalid stuff', () => {
        const result = misc.parseSchedule(['12:34', 'invalid', '1030', '25:00', '1', '01', '']);
        expect(result).toBeTruthy();
        expect(result.valid).toEqual([
            { string: '12:34', hours: 12, minutes: 34 },
        ]);
        expect(result.invalid).toEqual(['invalid', '1030', '25:00', '1', '01']);
    });
});

test('redactApiKeys', () => {
    expect(misc.redactApiKeys('')).toBe('')
    expect(misc.redactApiKeys('abc')).toBe('abc')

    const example = `
    sv_licenseKey cfxk_NYWn5555555500000000_2TLnnn
    sv_licenseKey "cfxk_NYWn5555555500000000_2TLnnn"
    sv_licenseKey 'cfxk_NYWn5555555500000000_2TLnnn'
    
    steam_webApiKey A2FAF8CF83B87E795555555500000000
    sv_tebexSecret 238a98bec4c0353fee20ac865555555500000000
    rcon_password a5555555500000000
    rcon_password "a5555555500000000"
    rcon_password 'a5555555500000000'
    mysql_connection_string "mysql://root:root@localhost:3306/txAdmin"
    https://discord.com/api/webhooks/33335555555500000000/xxxxxxxxxxxxxxxxxxxx5555555500000000`;

    const result = misc.redactApiKeys(example)
    expect(result).toContain('[REDACTED]');
    expect(result).toContain('2TLnnn');
    expect(result).not.toContain('5555555500000000');
    expect(result).not.toContain('mysql://');
})

test('now', () => {
    const result = misc.now();
    expect(typeof result).toBe('number');
    expect(result.toString().length).toBe(10);
    expect(result.toString()).not.toContain('.');
    expect(result.toString()).not.toContain('-');
});

test('anyUndefined', () => {
    expect(misc.anyUndefined(undefined, 'test')).toBe(true);
    expect(misc.anyUndefined('test', 'xxxx')).toBe(false);
    expect(misc.anyUndefined(undefined, undefined)).toBe(true);
});

test('calcExpirationFromDuration', () => {
    const currTs = misc.now();
    let result = misc.calcExpirationFromDuration('1 hour');
    expect(result?.duration).toBe(3600);
    expect(result?.expiration).toBe(currTs + 3600);

    result = misc.calcExpirationFromDuration('1 hours');
    expect(result?.duration).toBe(3600);

    result = misc.calcExpirationFromDuration('permanent');
    expect(result?.expiration).toBe(false);

    expect(() => misc.calcExpirationFromDuration('x day')).toThrowError('duration number');
    expect(() => misc.calcExpirationFromDuration('')).toThrowError('duration number');
    expect(() => misc.calcExpirationFromDuration('-1 day')).toThrowError('duration number');
});

test('parseLimitedFloat', () => {
    expect(misc.parseLimitedFloat('123.4567899999')).toBe(123.45679);
    expect(misc.parseLimitedFloat(123.4567899999)).toBe(123.45679);
    expect(misc.parseLimitedFloat(123.4567899999, 2)).toBe(123.46);
    expect(misc.parseLimitedFloat(0.1 + 0.2)).toBe(0.3);
});
