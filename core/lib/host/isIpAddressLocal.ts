const modulename = 'IpChecker';
import consoleFactory from '@lib/console';
const console = consoleFactory(modulename);

const extendedAllowedLanIps: string[] = [];


/**
 * Return if the IP Address is a loopback interface, LAN, detected WAN or any other
 * IP that is registered by the user via the forceInterface convar or config file.
 * 
 * This is used to secure the webpipe auth and the rate limiter.
 */
export const isIpAddressLocal = (ipAddress: string): boolean => {
    return (
        /^(127\.|192\.168\.|10\.|::1|fd00::)/.test(ipAddress)
        || extendedAllowedLanIps.includes(ipAddress)
    )
}


/**
 * Used to register a new LAN interface. 
 * Added automatically from TXHOST_INTERFACE and banner.js after detecting the WAN address.
 */
export const addLocalIpAddress = (ipAddress: string): void => {
    // console.verbose.debug(`Adding local IP address: ${ipAddress}`);
    extendedAllowedLanIps.push(ipAddress);
}
