/**
 * Configs
 */
const daysMs = 24 * 60 * 60 * 1000;
export const PDL_CRASH_REASON_CHAR_LIMIT = 512;
export const PDL_UNKNOWN_REASON_CHAR_LIMIT = 320;
export const PDL_UNKNOWN_LIST_SIZE_LIMIT = 200; //at most 62.5kb (200*320/1024)
export const PDL_RETENTION = 14 * daysMs;
