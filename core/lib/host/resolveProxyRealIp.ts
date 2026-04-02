import { txHostConfig } from '@core/globalData';
import { isIpInRanges } from '@lib/host/isIpInRanges';
import consts from '@shared/consts';


/**
 * Resolves the real client IP from X-Forwarded-For header when the
 * direct connection IP is a trusted proxy. Returns the original IP
 * if proxy support is not configured or the source is not trusted.
 *
 * When there are multiple proxies, we walk X-Forwarded-For from right
 * to left, skipping trusted proxy IPs, and return the first untrusted one.
 */
export const resolveProxyRealIp = (socketIp: string, xffHeader: string | undefined) => {
    const { proxyIpRanges } = txHostConfig;
    if (!proxyIpRanges || !isIpInRanges(socketIp, proxyIpRanges)) {
        return undefined;
    }

    if (!xffHeader) return undefined;

    // X-Forwarded-For: client, proxy1, proxy2
    // Walk from right to left, skipping trusted proxies
    const ips = xffHeader.split(',').map((s) => s.trim());
    for (let i = ips.length - 1; i >= 0; i--) {
        const ip = ips[i];
        if (!consts.regexValidIP.test(ip)) continue;
        if (!isIpInRanges(ip, proxyIpRanges)) {
            return ip;
        }
    }

    // All IPs in the chain are trusted proxies — return the leftmost
    return ips[0] && consts.regexValidIP.test(ips[0]) ? ips[0] : undefined;
};
