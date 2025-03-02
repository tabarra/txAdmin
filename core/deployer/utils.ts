import { canWriteToPath, getPathFiles } from '@lib/fs';

//File created up to v7.3.2
const EMPTY_FILE_NAME = '.empty';


/**
 * Perform deployer local target path permission/emptiness checking.
 */
export const validateTargetPath = async (deployPath: string) => {
    const canCreateFolder = await canWriteToPath(deployPath);
    if(!canCreateFolder) {
        throw new Error('Path is not writable due to missing permissions or invalid path.');
    }
    try {
        const pathFiles = await getPathFiles(deployPath);
        if (pathFiles.some((x) => x.name !== EMPTY_FILE_NAME)) {
            throw new Error('This folder already exists and is not empty!');
        }
    } catch (error) {
        if ((error as any).code !== 'ENOENT') throw error;
    }
    return true as const;
};


/**
 * Create a template recipe file
 */
export const makeTemplateRecipe = (serverName: string, author: string) => [
    `name: ${serverName}`,
    `author: ${author}`,
    '',
    '# This is just a placeholder, please don\'t use it!',
    'tasks: ',
    '    - action: waste_time',
    '      seconds: 5',
    '    - action: waste_time',
    '      seconds: 5',
].join('\n');
