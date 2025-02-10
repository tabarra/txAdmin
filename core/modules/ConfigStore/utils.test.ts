import { suite, it, expect } from 'vitest';
import { ConfigScaffold } from './schema';
import { confx, UpdateConfigKeySet } from './utils';


suite('confx utility', () => {
    it('should check if a value exists (has)', () => {
        const config: ConfigScaffold = {
            scope1: {
                key1: 'value1',
            },
        };
        const conf = confx(config);

        expect(conf.has('scope1', 'key1')).toBe(true);
        expect(conf.has('scope1', 'key2')).toBe(false);
        expect(conf.has('scope2', 'key1')).toBe(false);
    });

    it('should retrieve a value (get)', () => {
        const config: ConfigScaffold = {
            scope1: {
                key1: 'value1',
            },
        };
        const conf = confx(config);

        expect(conf.get('scope1', 'key1')).toBe('value1');
        expect(conf.get('scope1', 'key2')).toBeUndefined();
        expect(conf.get('scope2', 'key1')).toBeUndefined();
    });

    it('should set a value (set)', () => {
        const config: ConfigScaffold = {};
        const conf = confx(config);

        conf.set('scope1', 'key1', 'value1');
        expect(config.scope1?.key1).toBe('value1');

        conf.set('scope1', 'key2', 'value2');
        expect(config.scope1?.key2).toBe('value2');
    });

    it('should unset a value (unset)', () => {
        const config: ConfigScaffold = {
            scope1: {
                key1: 'value1',
                key2: 'value2',
            },
        };
        const conf = confx(config);

        conf.unset('scope1', 'key1');
        expect(config.scope1?.key1).toBeUndefined();
        expect(config.scope1?.key2).toBe('value2');

        conf.unset('scope1', 'key2');
        expect(config.scope1).toBeUndefined();
    });

    it('should handle nested configurations properly', () => {
        const config: ConfigScaffold = {
            scope1: {
                key1: { nested: 'value' },
            },
        };
        const conf = confx(config);

        expect(conf.get('scope1', 'key1')).toEqual({ nested: 'value' });
        conf.set('scope1', 'key2', { another: 'value' });
        expect(config.scope1?.key2).toEqual({ another: 'value' });

        conf.unset('scope1', 'key1');
        expect(config.scope1?.key1).toBeUndefined();
    });
});


suite('UpdateConfigKeySet', () => {
    it('should add keys with scope and key separately', () => {
        const set = new UpdateConfigKeySet();
        set.add('example', 'serverName');
        expect(set.raw).toEqual([{
            full: 'example.serverName',
            scope: 'example',
            key: 'serverName'
        }]);
    });

    it('should add keys with dot notation', () => {
        const set = new UpdateConfigKeySet();
        set.add('example.serverName');
        expect(set.raw).toEqual([{
            full: 'example.serverName',
            scope: 'example',
            key: 'serverName'
        }]);
    });

    it('should match exact keys', () => {
        const set = new UpdateConfigKeySet();
        set.add('example', 'serverName');
        expect(set.hasMatch('example.serverName')).toBe(true);
        expect(set.hasMatch('example.enabled')).toBe(false);
    });

    it('should match wildcard patterns when checking', () => {
        const set = new UpdateConfigKeySet();
        set.add('example', 'serverName');
        set.add('example', 'enabled');

        expect(set.hasMatch('example.*')).toBe(true);
        expect(set.hasMatch('server.*')).toBe(false);
        expect(set.hasMatch('example.whatever')).toBe(false);
        expect(set.hasMatch('*.serverName')).toBe(true);
        expect(set.hasMatch('*.*')).toBe(true);
    });

    it('should match when providing an array of patterns', () => {
        const set = new UpdateConfigKeySet();
        set.add('example', 'serverName');
        set.add('monitor', 'enabled');

        expect(set.hasMatch(['example.serverName', 'monitor.status'])).toBe(true);
        expect(set.hasMatch(['server.*', 'example.*'])).toBe(true);
        expect(set.hasMatch(['other.thing', 'another.config'])).toBe(false);
        expect(set.hasMatch(['*.enabled', '*.disabled'])).toBe(true);
        expect(set.hasMatch([])).toBe(false);
    });

    it('should not allow adding wildcard', () => {
        const set = new UpdateConfigKeySet();
        expect(() => set.add('example.*')).toThrow();
        expect(() => set.add('example', '*')).toThrow();
        expect(() => set.add('*.example')).toThrow();
        expect(() => set.add('*', 'example')).toThrow();
        expect(() => set.add('*.*')).toThrow();
        expect(() => set.add('*', '*')).toThrow();
    });

    it('should track size correctly', () => {
        const set = new UpdateConfigKeySet();
        expect(set.size).toBe(0);
        set.add('example', 'serverName');
        expect(set.size).toBe(1);
        set.add('example.enabled');
        expect(set.size).toBe(2);
    });

    it('should list all added items', () => {
        const set = new UpdateConfigKeySet();
        set.add('example', 'serverName');
        expect(set.list).toEqual(['example.serverName']);
        set.add('example', 'enabled');
        expect(set.list).toEqual(['example.serverName','example.enabled']);
    });
});
