import path from 'node:path';
import fsp from 'node:fs/promises';
import { txEnv } from "@core/globalData";


/**
 * Creates or removes a monitor/.runtime/ file
 */
export const setRuntimeFile = async (fileName: string, fileData: string | Buffer | null) => {
    const destRuntimePath = path.resolve(txEnv.txaPath, '.runtime');
    const destFilePath = path.resolve(destRuntimePath, fileName);

    //Ensure the /.runtime/ folder exists
    try {
        await fsp.mkdir(destRuntimePath, { recursive: true });
    } catch (error) {
        console.error(`Failed to create .runtime folder: ${(error as any).message}`);
        return false;
    }

    //If deleting the file, just unlink it
    if (fileData === null) {
        try {
            await fsp.unlink(destFilePath);
        } catch (error) {
            const msg = (error as Error).message ?? 'Unknown error';
            if (!msg.includes('ENOENT')) {
                console.error(`Failed to delete runtime file: ${msg}`);
                return false;
            }
        }
        return true;
    }

    //Write the file
    try {
        await fsp.writeFile(destFilePath, fileData);
        return true;
    } catch (error) {
        console.error(`Failed to write runtime file: ${(error as any).message}`);
    }
    return false;
}
