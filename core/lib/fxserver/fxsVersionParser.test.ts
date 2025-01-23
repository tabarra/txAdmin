//@ts-nocheck
import { test, expect } from 'vitest';
import { parseFxserverVersion } from './fxsVersionParser';
const p = parseFxserverVersion;


test('normal versions', () => {
    expect(p('FXServer-master SERVER v1.0.0.7290 win32')).toEqual({
        build: 7290,
        platform: 'windows',
        branch: 'master',
        valid: true,
    });
    expect(p('FXServer-master SERVER v1.0.0.10048 win32')).toEqual({
        build: 10048,
        platform: 'windows',
        branch: 'master',
        valid: true,
    });
    expect(p('FXServer-master v1.0.0.9956 linux')).toEqual({
        build: 9956,
        platform: 'linux',
        branch: 'master',
        valid: true,
    });
});

test('feat branch versions', () => {
    expect(p('FXServer-feature/improve_player_dropped_event SERVER v1.0.0.20240707 win32')).toEqual({
        build: 20240707,
        platform: 'windows',
        branch: 'feature/improve_player_dropped_event',
        valid: true,
    });
    expect(p('FXServer-abcdef SERVER v1.0.0.20240707 win32')).toEqual({
        build: 20240707,
        platform: 'windows',
        branch: 'abcdef',
        valid: true,
    });
});

test('invalids', () => {
    expect(() => p(1111 as any)).toThrow('expected');
    expect(p('FXServer-no-version (didn\'t run build tools?)')).toEqual({
        valid: false,
        build: null,
        branch: null,
        platform: null,
    });
    expect(p('Invalid server (internal validation failed)')).toEqual({
        valid: false,
        build: null,
        branch: null,
        platform: null,
    });
    //attempt to salvage platform
    expect(p('xxxxxxxx win32')).toEqual({
        valid: false,
        build: null,
        branch: null,
        platform: 'windows',
    });
    expect(p('xxxxxxxx linux')).toEqual({
        valid: false,
        build: null,
        branch: null,
        platform: 'linux',
    });
});
