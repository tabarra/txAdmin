import fs from 'node:fs';

export type FxsBinVersionInfo = {
    valid: true;
    branch: string | null;
    build: number;
    raw: string;
} | {
    valid: false;
    branch: null;
    build: null;
    raw: null;
};

// Valid branch: alphanumeric, dashes, underscores, slashes
const VALID_BRANCH_REGEX = /^[\w\-]+(\/[\w\-]+)*$/;


//MARK: Main
/**
 * Reads and extracts version info from the FXServer binary.
 * Works cross-platform (PE on Windows, ELF on Linux).
 * 
 * Searches for pattern: {branch} [SERVER] v1.0.0.{build} {platform}
 * Examples:
 *   - master SERVER v1.0.0.7290 win32
 *   - feature/my-branch SERVER v1.0.0.20260126 linux
 */
export const readFxsGen8BinVersion = (fxsBinPath: string): FxsBinVersionInfo => {

    try {
        //Read the binary file
        const buffer = fs.readFileSync(fxsBinPath);
        // latin1 preserves byte values while allowing string/regex operations
        const content = buffer.toString('latin1');

        // Positive lookbehind ensures branch starts after null byte
        // Named groups for cleaner extraction
        const versionRegex = /(?<=\x00)(?<branch>[^\x00 ]+) (?:SERVER )?v1\.0\.0\.(?<build>\d{4,8}) (?<platform>win32|linux)/g;

        for (const match of content.matchAll(versionRegex)) {
            const groups = match.groups as { branch: string; build: string; platform: string };
            const raw = match[0];

            // Skip if branch has non-printable chars
            if (!/^[\x21-\x7E]+$/.test(groups.branch)) continue;

            // Skip unreasonably long branch names (likely false positive)
            if (groups.branch.length > 128) continue;

            return {
                valid: true,
                branch: VALID_BRANCH_REGEX.test(groups.branch) ? groups.branch : null,
                build: parseInt(groups.build, 10),
                raw: raw.trim(),
            };
        }
    } catch {
        console.error('Failed to read FXServer binary: ', fxsBinPath);
    }

    return {
        valid: false,
        branch: null,
        build: null,
        raw: null,
    };
};
