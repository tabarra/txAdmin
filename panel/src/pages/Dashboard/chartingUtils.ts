/**
 * Find which is the last bucket boundary that is less than or equal to the minTickInterval, excluding +Infinity.
 */
export const getMinTickIntervalMarker = (boundaries: (string | number)[], minTickInterval: number) => {
    let found;
    for (const bucketLE of boundaries) {
        if (typeof bucketLE === 'string' || bucketLE <= minTickInterval) {
            found = bucketLE;
        }
    }
    if (typeof found === 'number') {
        return found;
    }
    return undefined;
}


/**
 * Format pewrd tick time buckets boundary values.
 */
export const formatTickBoundary = (value: number | string) => {
    if (value === '+Inf') {
        return '+Inf';
    } else if (typeof value === 'string') {
        return '???';
    } else if (value < 0) {
        return '<0 ms';
    } else if (value === 0) {
        return '0 ms';
    } else if (value < 0.001) {
        return '<1 ms';
    } else if (value >= 0.001 && value < 1) {
        return `${(value * 1000).toFixed(0)} ms`;
    } else {
        if (value % 1 !== 0) {
            return `${value.toFixed(value < 1 ? 3 : 2)} s`;
        } else {
            return `${value.toFixed(0)} s`;
        }
    }
}
