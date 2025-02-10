import path from 'node:path';
import fse from 'fs-extra';


/**
 * Check if its possible to create a file in a folder
 */
const canCreateFile = async (targetPath: string) => {
    try {
        const filePath = path.join(targetPath, '.empty');
        await fse.outputFile(filePath, '#save_attempt_please_ignore');
        await fse.remove(filePath);
        return true;
    } catch (error) {
        return false;
    }
};


/**
 * Perform deployer local target path permission/emptiness checking
 * FIXME: timeout to remove folders, or just autoremove them idk
 */
export const validateTargetPath = async (deployPath: string) => {
    if (await fse.pathExists(deployPath)) {
        const pathFiles = await fse.readdir(deployPath);
        if (pathFiles.some((x) => x !== '.empty')) {
            throw new Error('This folder is not empty!');
        } else {
            if (await canCreateFile(deployPath)) {
                return 'Exists, empty, and writtable!';
            } else {
                throw new Error('Path exists, but its not a folder, or its not writtable.');
            }
        }
    } else {
        if (await canCreateFile(deployPath)) {
            await fse.remove(deployPath);
            return 'Path didn\'t existed, we created one (then deleted it).';
        } else {
            throw new Error('Path doesn\'t exist, and we could not create it. Please check parent folder permissions.');
        }
    }
};


/**
 * Create a template recipe file
 */
export const makeTemplateRecipe = (serverName: string, author: string) => `name: ${serverName}
author: ${author}

# This is just a placeholder, please don't run it!
tasks: 
    - action: waste_time
      seconds: 5
    - action: waste_time
      seconds: 5
`;
