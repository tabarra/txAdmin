/**
 * Cleans up a player name and returns one version to be displayed, and one pure version to be used for fuzzy matching.
 * In case the name has no ascii characters, the pure name will be "empty name".
 * NOTE: this is not perfect, but took me two hours to arrive to this point.
 */
export default (original: string) => {
    // \u0000-\u001F > C0 controls
    // \u007F-\u009F > delete + C1 controls
    // \u1CBB\u1CBC > invisible characters
    // \u200B-\u200D\uFEFF > zero width spaces
    // \u200E > RTL mark
    // \uA9C1-\uA9C5 > javanese text adornation (oversized)
    // \u239B-\u23AD > Miscellaneous Technical — Bracket pieces items (oversized)
    let displayName = original
        .substring(0, 75) //lua should have truncated it first, but double checking
        .replace(/[\u0000-\u001F\u007F-\u009F\u1CBB\u1CBC\u200B-\u200D\uFEFF\u200E\uA9C1-\uA9C5\u239B-\u23AD]/g, '')
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
