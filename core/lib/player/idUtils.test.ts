import { test, expect, suite, it } from 'vitest';
import * as idUtils from './idUtils';


test('parsePlayerId', () => {
    let result = idUtils.parsePlayerId('FIVEM:555555');
    expect(result.isIdValid).toBe(true);
    expect(result.idType).toBe('fivem');
    expect(result.idValue).toBe('555555');
    expect(result.idlowerCased).toBe('fivem:555555');

    result = idUtils.parsePlayerId('fivem:xxxxx');
    expect(result.isIdValid).toBe(false);
});

test('parsePlayerIds', () => {
    const result = idUtils.parsePlayerIds(['fivem:555555', 'fivem:xxxxx']);
    expect(result.validIdsArray).toEqual(['fivem:555555']);
    expect(result.invalidIdsArray).toEqual(['fivem:xxxxx']);
    expect(result.validIdsObject?.fivem).toBe('555555');
});

test('filterPlayerHwids', () => {
    const result = idUtils.filterPlayerHwids([
        '5:55555555000000002d267c6638c8873d55555555000000005555555500000000',
        'invalidHwid'
    ]);
    expect(result.validHwidsArray).toEqual(['5:55555555000000002d267c6638c8873d55555555000000005555555500000000']);
    expect(result.invalidHwidsArray).toEqual(['invalidHwid']);
});

test('parseLaxIdsArrayInput', () => {
    const result = idUtils.parseLaxIdsArrayInput('55555555000000009999, steam:1100001ffffffff, invalid');
    expect(result.validIds).toEqual(['discord:55555555000000009999', 'steam:1100001ffffffff']);
    expect(result.invalids).toEqual(['invalid']);
});

test('getIdFromOauthNameid', () => {
    expect(idUtils.getIdFromOauthNameid('https://forum.cfx.re/internal/user/555555')).toBe('fivem:555555');
    expect(idUtils.getIdFromOauthNameid('xxxxx')).toBe(false);
});
