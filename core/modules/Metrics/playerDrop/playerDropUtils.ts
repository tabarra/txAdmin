export const getDateHourEnc = () => {
    const now = new Date();
    const dateHourTs = now.setUTCMinutes(0, 0, 0);
    return {
        dateHourTs,
        dateHourStr: now.toISOString(),
    }
}

export const parseDateHourEnc = (dateHourStr: string) => {
    const date = new Date(dateHourStr);
    const dateHourTs = date.setUTCMinutes(0, 0, 0);
    return {
        dateHourTs,
        dateHourStr,
    }
}
