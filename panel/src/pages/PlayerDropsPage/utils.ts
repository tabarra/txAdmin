/**
 * Parses a resource name and version from a string like monitor/v7.2.0
 */
export const parseResourceNameVerion = (res: string) => {
    const index = res.indexOf('/');
    if (index === -1) {
        return { name: res };
    }
    const versionStr = res.substring(index + 1);
    return {
        name: res.substring(0, index),
        version: versionStr ? versionStr : undefined,
    };
};


/**
 * Process resource changes and return removed, added and updated resources
 */
export const processResourceChanges = (
    removed: string[],
    added: string[]
): { removed: string[], added: string[], updated: PackageChange[] } => {
    const removedResources = removed.map(parseResourceNameVerion);
    const addedResources = added.map(parseResourceNameVerion);

    const removedNames = new Set(removedResources.map(res => res.name));
    const addedNames = new Set(addedResources.map(res => res.name));

    const removedOnly = removedResources
        .filter(res => !addedNames.has(res.name))
        .map(res => res?.version ? `${res.name}/${res.version}` : res.name);
    const addedOnly = addedResources
        .filter(res => !removedNames.has(res.name))
        .map(res => res?.version ? `${res.name}/${res.version}` : res.name);

    const updated = removedResources
        .filter(res => addedNames.has(res.name))
        .map(res => {
            const newRes = addedResources.find(newRes => newRes.name === res.name);
            return {
                resName: res.name,
                oldVer: res.version ?? '???',
                newVer: newRes?.version ?? '???'
            };
        });

    return {
        removed: removedOnly,
        added: addedOnly,
        updated: updated
    };
};

type PackageChange = { resName: string, oldVer: string, newVer: string };
