import { suite, it, expect } from 'vitest';
import { ConfigScaffold } from './schema';
import { confx } from './confx';


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
