const byteToRegexHex = (byte: number) => {
    return '\\u' + byte.toString(16).padStart(2, '0').toUpperCase();
}
function unicodeUtf16RangeToRegex(codePointStart: number, codePointEnd: number) {
    const TEN_BITS = parseInt('1111111111', 2);
    codePointStart -= 0x10000;
    const leadSurrogateStart = 0xD800 + (codePointStart >> 10);
    const tailSurrogateStart = 0xDC00 + (codePointStart & TEN_BITS);

    codePointEnd -= 0x10000;
    const leadSurrogateEnd = 0xD800 + (codePointEnd >> 10);
    const tailSurrogateEnd = 0xDC00 + (codePointEnd & TEN_BITS);

    return `${byteToRegexHex(leadSurrogateStart)}[${byteToRegexHex(tailSurrogateStart)}-${byteToRegexHex(tailSurrogateEnd)}]`;
}
// unicodeUtf16RangeToRegex(0x1D000, 0x1D0FF) = \uD834[\uDC00-\uDCFF]

/**
 * Cleans up a player name and returns one version to be displayed, and one pure version to be used for fuzzy matching.
 * In case the name has no ascii characters, the pure name will be "empty name".
 * NOTE: this is not perfect, but took me two hours to arrive to this point.
 */
export default (original: string) => {
    // \u0000-\u001F        C0 controls
    // \u007F-\u009F        delete + C1 controls
    // \u1CBB\u1CBC         invisible characters
    // \u200B-\u200D        zero width spaces
    // \uFEFF               zero width no-break space
    // \u200E               RTL mark
    // \uA980-\uA9DF        javanese (oversized)
    // \u239B-\u23AD        Miscellaneous Technical — Bracket pieces items (oversized)
    // \u534D\u5350         swastika
    // \u1000-\u109F        Myanmar
    // \u0B80-\u0BFF        Tamil
    // \uFDFD\u2E3B         oversized arabic characters

    // UTF-16 ranges, use unicodeUtf16RangeToRegex
    // U+12000 - U+123FF 	Cuneiform
    // U+12400 - U+1247F 	Cuneiform Numbers and Punctuation
    // U+12480 - U+1254F 	Early Dynastic Cuneiform
    // U+1D000 - U+1D0FF 	Byzantine Musical Symbols
    let displayName = original
        .substring(0, 75) //lua should have truncated it first, but double checking
        .replace(/[\u0000-\u001F\u007F-\u009F\u1CBB\u1CBC\u200B-\u200D\uFEFF\u200E\uA980-\uA9DF\u239B-\u23AD\u534D\u5350\u1000-\u109F\u0B80-\u0BFF]/g, '')
        .replace(/(\uD808[\uDC00-\uDFFF]|\uD809[\uDC00-\uDC7F]|\uD809[\uDC80-\uDD4F]|\uD834[\uDC00-\uDCFF])/g, '')
        .replace(/~(HUD_\S+|HC_\S+|[a-z]|[a1]_\d+|bold|italic|ws|wanted_star|nrt|EX_R\*|BLIP_\S+|ACCEPT|CANCEL|PAD_\S+|INPUT_\S+|INPUTGROUP_\S+)~/ig, '') // https://docs.fivem.net/docs/game-references/text-formatting/
        .replace(/\^\d/ig, '') //console color codes
        .replace(/\p{Mark}{2,}/ug, '') //2+ consecutive marks (zalgo text)
        .replace(/\s+/g, ' ')
        .trim();
    if (!displayName.length) displayName = 'empty name';
    let pureName = displayName
        .normalize('NFKC')
        .replace(/[^\p{Letter}\p{Number} ]/gu, '')
        .replace(/\s+/g, '')
        .toLocaleLowerCase()
        .trim();
    if (!pureName.length) pureName = 'emptyname';

    return {displayName, pureName};
};
