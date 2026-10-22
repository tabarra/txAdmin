import { suite, it, expect } from 'vitest';
import { isForwardedHttps } from './sessionMws';


suite('isForwardedHttps', () => {
    it('should accept a plain https value', () => {
        expect(isForwardedHttps('https')).toBe(true);
    });

    it('should be case-insensitive', () => {
        expect(isForwardedHttps('HTTPS')).toBe(true);
        expect(isForwardedHttps('Https')).toBe(true);
    });

    it('should reject http', () => {
        expect(isForwardedHttps('http')).toBe(false);
    });

    it('should use the first hop in a multi-proxy chain', () => {
        expect(isForwardedHttps('https, http')).toBe(true);
        expect(isForwardedHttps('http, https')).toBe(false);
    });

    it('should reject missing or malformed values', () => {
        expect(isForwardedHttps(undefined)).toBe(false);
        expect(isForwardedHttps('')).toBe(false);
        expect(isForwardedHttps(['https'])).toBe(false);
        expect(isForwardedHttps(123)).toBe(false);
    });
});
