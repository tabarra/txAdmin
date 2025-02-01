import { test, expect, suite, it } from 'vitest';
import * as misc from './misc';


suite('parseSchedule', () => {
    it('should parse a valid schedule', () => {
        const result = misc.parseSchedule(['00:00', '00:15', '1:30', '12:30']);
        expect(result.valid).toEqual([
            { string: '00:00', hours: 0, minutes: 0 },
            { string: '00:15', hours: 0, minutes: 15 },
            { string: '01:30', hours: 1, minutes: 30 },
            { string: '12:30', hours: 12, minutes: 30 },
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

    it('should remove duplicates', () => {
        const result = misc.parseSchedule(['02:00', '02:00', '05:55', '13:55']);
        expect(result.valid).toEqual([
            { string: '02:00', hours: 2, minutes: 0 },
            { string: '05:55', hours: 5, minutes: 55 },
            { string: '13:55', hours: 13, minutes: 55 },
        ]);
        expect(result.invalid).toEqual([]);
    });

    it('should sort the times', () => {
        const result = misc.parseSchedule(['00:00', '00:01', '23:59', '01:01', '01:00']);
        expect(result.valid).toEqual([
            { string: '00:00', hours: 0, minutes: 0 },
            { string: '00:01', hours: 0, minutes: 1 },
            { string: '01:00', hours: 1, minutes: 0 },
            { string: '01:01', hours: 1, minutes: 1 },
            { string: '23:59', hours: 23, minutes: 59 },
        ]);
        expect(result.invalid).toEqual([]);
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


suite('redactStartupSecrets', () => {
    const redactedString = '[REDACTED]';
    it('should return an empty array when given an empty array', () => {
        expect(misc.redactStartupSecrets([])).toEqual([]);
    });

    it('should return the same array if no redaction keys are present', () => {
        const args = ['node', 'script.js', '--help'];
        expect(misc.redactStartupSecrets(args)).toEqual(args);
    });

    it('should redact a sv_licenseKey secret correctly', () => {
        const args = ['sv_licenseKey', 'cfxk_12345_secret'];
        // The regex captures "secret" and returns "[REDACTED cfxk...secret]"
        const expected = ['sv_licenseKey', '[REDACTED cfxk...secret]'];
        expect(misc.redactStartupSecrets(args)).toEqual(expected);
    });

    it('should not redact sv_licenseKey secret if the secret does not match the regex', () => {
        const args = ['sv_licenseKey', 'invalidsecret'];
        const expected = ['sv_licenseKey', 'invalidsecret'];
        expect(misc.redactStartupSecrets(args)).toEqual(expected);
    });

    it('should redact steam_webApiKey secret correctly', () => {
        const validKey = 'a'.repeat(32);
        const args = ['steam_webApiKey', validKey];
        const expected = ['steam_webApiKey', redactedString];
        expect(misc.redactStartupSecrets(args)).toEqual(expected);
    });

    it('should redact sv_tebexSecret secret correctly', () => {
        const validSecret = 'b'.repeat(40);
        const args = ['sv_tebexSecret', validSecret];
        const expected = ['sv_tebexSecret', redactedString];
        expect(misc.redactStartupSecrets(args)).toEqual(expected);
    });

    it('should redact rcon_password secret correctly', () => {
        const args = ['rcon_password', 'mysecretpassword'];
        const expected = ['rcon_password', redactedString];
        expect(misc.redactStartupSecrets(args)).toEqual(expected);
    });

    it('should redact mysql_connection_string secret correctly', () => {
        const args = [
            'mysql_connection_string',
            'Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;',
        ];
        const expected = ['mysql_connection_string', redactedString];
        expect(misc.redactStartupSecrets(args)).toEqual(expected);
    });

    it('should handle multiple redactions in a single array', () => {
        const validSteamKey = 'c'.repeat(32);
        const args = [
            'sv_licenseKey', 'cfxk_12345_abcdef',
            'someOtherArg', 'value',
            'steam_webApiKey', validSteamKey,
        ];
        const expected = [
            'sv_licenseKey', '[REDACTED cfxk...abcdef]',
            'someOtherArg', 'value',
            'steam_webApiKey', redactedString,
        ];
        expect(misc.redactStartupSecrets(args)).toEqual(expected);
    });

    it('should handle case-insensitive key matching', () => {
        const args = ['SV_LICENSEKEY', 'cfxk_12345_SECRET'];
        const expected = ['SV_LICENSEKEY', '[REDACTED cfxk...SECRET]'];
        expect(misc.redactStartupSecrets(args)).toEqual(expected);
    });

    it('should leave a key unchanged if it is the last element', () => {
        const args = ['sv_licenseKey'];
        const expected = ['sv_licenseKey'];
        expect(misc.redactStartupSecrets(args)).toEqual(expected);
    });

    it('should handle rules without regex', () => {
        const args = ['rcon_password', 'whatever'];
        const expected = ['rcon_password', redactedString];
        expect(misc.redactStartupSecrets(args)).toEqual(expected);
    });

    it('should handle a real example', () => {
        const args = [
            "+setr", "txAdmin-debugMode", "true",
            "+set", "tx2faSecret", "whatever",
            "+set", "sv_licenseKey", "cfxk_xxxxxxxxxxxxxxxxxxxx_yyyyy",
            "+set", "onesync", "enabled",
            "+set", "sv_enforceGameBuild", "2545",
        ];
        const expected = [
            "+setr", "txAdmin-debugMode", "true",
            "+set", "tx2faSecret", redactedString,
            "+set", "sv_licenseKey", "[REDACTED cfxk...yyyyy]",
            "+set", "onesync", "enabled",
            "+set", "sv_enforceGameBuild", "2545",
        ];
        expect(misc.redactStartupSecrets(args)).toEqual(expected);
    });

    it('should redact discord webhooks', () => {
        const args = [
            "aaa",
            "https://discord.com/api/webhooks/33335555555500000000/xxxxxxxxxxxxxxxxxxxx5555555500000000",
            "bbb",
        ];
        const expected = [
            "aaa",
            "https://discord.com/api/webhooks/[REDACTED]/[REDACTED]",
            "bbb",
        ];
        expect(misc.redactStartupSecrets(args)).toEqual(expected);
    });
});


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
