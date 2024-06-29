import { suite, it, expect, test } from 'vitest';
import { parseResourceNameVerion, processResourceChanges, splitPrefixedStrings } from './utils';


suite('parseResourceNameVerion', () => {
    const fnc = parseResourceNameVerion;

    it('correctly parse simple resource', () => {
        expect(fnc('aaa')).toEqual({ name: 'aaa' });
    });
    it('correctly parse versioned resource', () => {
        expect(fnc('aaa/xxx')).toEqual({ name: 'aaa', version: 'xxx' });
    });
    it('correctly handles multiple slashes', () => {
        expect(fnc('aaa/xxx/yyy')).toEqual({ name: 'aaa', version: 'xxx/yyy' });
    });
    it('correctly handles missing version part case ', () => {
        expect(fnc('aaa/')).toEqual({ name: 'aaa' });
        expect(fnc('aaa//')).toEqual({ name: 'aaa', version: '/' });
    });
    it('correctly handles real case ', () => {
        expect(fnc('monitor/v7.2.0')).toEqual({ name: 'monitor', version: 'v7.2.0' });
    });
});


suite('processResourceChanges', () => {
    const fnc = processResourceChanges;

    it('correctly detect simple added and removed', () => {
        const removed = ['aaa', 'bbb'];
        const added = ['xxx'];

        expect(fnc(removed, added)).toEqual({
            removed: ['aaa', 'bbb'],
            added: ['xxx'],
            updated: [],
        });
    });

    it('correctly detect version changes', () => {
        const removed = ['aaa', 'xxx/p', 'yyy', 'zzz/s'];
        const added = ['bbb', 'xxx/q', 'yyy/r', 'zzz'];

        expect(fnc(removed, added)).toEqual({
            removed: ['aaa'],
            added: ['bbb'],
            updated: [
                { resName: 'xxx', oldVer: 'p', newVer: 'q' },
                { resName: 'yyy', oldVer: '???', newVer: 'r' },
                { resName: 'zzz', oldVer: 's', newVer: '???' },
            ],
        });
    });

    it('correctly detect version without matching change', () => {
        const removed = ['aaa/x'];
        const added = ['bbb/x'];

        expect(fnc(removed, added)).toEqual({
            removed: ['aaa/x'],
            added: ['bbb/x'],
            updated: [],
        });
    });

    it.todo('correctly handle weird versions', () => {
        const removed = ['aaa/x/y', 'xxx/p', 'yyy', 'zzz/s'];
        const added = ['bbb', 'xxx/q', 'yyy/r', 'zzz'];

        expect(fnc(removed, added)).toEqual({
            removed: [],
            added: [],
            updated: [
                { resName: 'xxx', oldVer: 'p', newVer: 'q' },
                { resName: 'yyy', oldVer: '???', newVer: 'r' },
                { resName: 'zzz', oldVer: 's', newVer: '???' },
            ],
        });
    });

    it('correct full example', () => {
        const removed = [
            'aaa',
            'ccc/1.0.0',
            'ddd',
            'eee/v5',
        ];
        const added = [
            'bbb',
            'ccc/1.1.0',
            'ddd/2.0.0',
            'eee',
        ];

        expect(fnc(removed, added)).toEqual({
            removed: [
                'aaa',
            ],
            added: [
                'bbb',
            ],
            updated: [
                { resName: 'ccc', oldVer: '1.0.0', newVer: '1.1.0' },
                { resName: 'ddd', oldVer: '???', newVer: '2.0.0' },
                { resName: 'eee', oldVer: 'v5', newVer: '???' },
            ],
        });
    });
});


test('splitPrefixedStrings', () => {
    const fnc = splitPrefixedStrings;
    const logLines = [
        '=xx',
        '=yy',
        'aa[=]bb',
        'aa[=]cc',
        'GTA5_b3095.ext!sub_xx (0x230)',
        'GTA5_b3095.ext!sub_xx (0x666)',
        'GTA5_b3095.ext+sub_xx (0x999)',
    ];
    expect(fnc(logLines)).toEqual([
        { prefix: false, suffix: '=xx' },
        { prefix: false, suffix: '=yy' },
        { prefix: false, suffix: 'aa[=]bb' },
        { prefix: 'aa', suffix: '[=]cc' },
        { prefix: false, suffix: 'GTA5_b3095.ext!sub_xx (0x230)' },
        { prefix: 'GTA5_b3095.ext!sub_xx', suffix: ' (0x666)' },
        { prefix: 'GTA5_b3095.ext', suffix: '+sub_xx (0x999)' }
    ]);
});
