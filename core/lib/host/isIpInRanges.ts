import { z } from 'zod';


/**
 * Parses an IPv4 address string into a 32-bit number.
 */
const ipToNumber = (ip: string) => {
    const parts = ip.split('.');
    return (
        (parseInt(parts[0]) << 24)
        | (parseInt(parts[1]) << 16)
        | (parseInt(parts[2]) << 8)
        | parseInt(parts[3])
    ) >>> 0;
};


/**
 * Parses a CIDR notation string (e.g. "10.0.0.0/8") or a single IP into
 * a { network, mask } pair for fast matching.
 */
const parseCidr = (cidr: string) => {
    const [ip, prefixStr] = cidr.split('/');
    const prefix = prefixStr !== undefined ? parseInt(prefixStr) : 32;
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    const network = ipToNumber(ip) & mask;
    return { network, mask };
};

type ParsedRange = { network: number; mask: number };


/**
 * Pre-parses an array of CIDR strings into a reusable matcher.
 * Accepts both "1.2.3.4/24" and plain "1.2.3.4" (treated as /32).
 */
export const parseIpRanges = (ranges: string[]): ParsedRange[] => {
    return ranges.map(parseCidr);
};


/**
 * Returns true if the given IPv4 address falls within any of the pre-parsed ranges.
 */
export const isIpInRanges = (ip: string, ranges: ParsedRange[]) => {
    const num = ipToNumber(ip);
    for (const range of ranges) {
        if ((num & range.mask) === range.network) return true;
    }
    return false;
};


/**
 * Zod schema for a comma-separated list of CIDR ranges or IPs.
 * Example: "10.0.0.0/8,172.16.0.0/12,192.168.1.1"
 */
const cidrRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/\d{1,2})?$/;
export const proxyIpRangeSchema = z.string().transform((val: string) => {
    return val.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
}).pipe(
    z.array(z.string().regex(cidrRegex, 'Each entry must be a valid IPv4 address or CIDR range (e.g. 10.0.0.0/8)'))
        .min(1, 'At least one IP or CIDR range is required')
);
