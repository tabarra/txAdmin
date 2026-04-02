import { suite, it, expect } from 'vitest';
import { parseIpRanges, isIpInRanges } from './isIpInRanges';


suite('parseIpRanges + isIpInRanges', () => {
    it('should match a single IP (/32)', () => {
        const ranges = parseIpRanges(['10.0.0.1']);
        expect(isIpInRanges('10.0.0.1', ranges)).toBe(true);
        expect(isIpInRanges('10.0.0.2', ranges)).toBe(false);
    });

    it('should match a /24 range', () => {
        const ranges = parseIpRanges(['192.168.1.0/24']);
        expect(isIpInRanges('192.168.1.0', ranges)).toBe(true);
        expect(isIpInRanges('192.168.1.255', ranges)).toBe(true);
        expect(isIpInRanges('192.168.1.100', ranges)).toBe(true);
        expect(isIpInRanges('192.168.2.1', ranges)).toBe(false);
    });

    it('should match a /16 range', () => {
        const ranges = parseIpRanges(['172.16.0.0/16']);
        expect(isIpInRanges('172.16.0.1', ranges)).toBe(true);
        expect(isIpInRanges('172.16.255.255', ranges)).toBe(true);
        expect(isIpInRanges('172.17.0.1', ranges)).toBe(false);
    });

    it('should match a /8 range', () => {
        const ranges = parseIpRanges(['10.0.0.0/8']);
        expect(isIpInRanges('10.0.0.1', ranges)).toBe(true);
        expect(isIpInRanges('10.255.255.255', ranges)).toBe(true);
        expect(isIpInRanges('11.0.0.1', ranges)).toBe(false);
    });

    it('should handle multiple ranges', () => {
        const ranges = parseIpRanges(['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16']);
        expect(isIpInRanges('10.1.2.3', ranges)).toBe(true);
        expect(isIpInRanges('172.20.5.5', ranges)).toBe(true);
        expect(isIpInRanges('192.168.100.1', ranges)).toBe(true);
        expect(isIpInRanges('8.8.8.8', ranges)).toBe(false);
    });

    it('should handle /0 (match everything)', () => {
        const ranges = parseIpRanges(['0.0.0.0/0']);
        expect(isIpInRanges('1.2.3.4', ranges)).toBe(true);
        expect(isIpInRanges('255.255.255.255', ranges)).toBe(true);
    });

    it('should handle /32 explicit', () => {
        const ranges = parseIpRanges(['1.2.3.4/32']);
        expect(isIpInRanges('1.2.3.4', ranges)).toBe(true);
        expect(isIpInRanges('1.2.3.5', ranges)).toBe(false);
    });
});
