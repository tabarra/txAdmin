import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function isValidRedirectPath(location: unknown) {
    if (typeof location !== 'string' || !location) return false;
    const url = new URL(location, window.location.href);
    return location.startsWith('/') && !location.startsWith('//') && url.hostname === window.location.hostname;
}
