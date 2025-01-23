/**
 * Parses a fxserver version convar into a number.
*/
export const parseFxserverVersion = (version: any): ParseFxserverVersionResult => {
    if (typeof version !== 'string') throw new Error(`expected string`);
    
    const fxsVersionRegex = /^FXServer-(?<branch>\S+).*?v1\.0\.0\.(?<build>\d{4,8}) (?<platform>\w+)$/
    try {
        const matches = fxsVersionRegex.exec(version);
        if (!matches) throw new Error(`no match`);
        return {
            valid: true,
            branch: matches.groups!.branch,
            build: parseInt(matches.groups!.build),
            platform: matches.groups!.platform === 'win32' ? 'windows' : 'linux',
        }
    } catch (error) {
        return {
            valid: false,
            branch: null,
            build: null,
            platform: version.includes('win32') ? 'windows' : version.includes('linux') ? 'linux' : null,
        }
    }
};

type ParseFxserverVersionResult = {
    valid: true;
    branch: string;
    build: number;
    platform: string;
} | {
    valid: false;
    branch: null;
    build: null;
    platform: 'windows' | 'linux' | null;
};
