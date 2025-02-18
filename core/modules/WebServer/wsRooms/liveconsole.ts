import type { RoomType } from "../webSocket";
import { AuthedAdminType } from "../authLogic";


/**
 * The console room is responsible for the server live console page
 */
export default {
    permission: 'console.view',
    eventName: 'consoleData',
    cumulativeBuffer: true,
    outBuffer: '',
    initialData: () => txCore.logger.fxserver.getRecentBuffer(),
    commands: {
        consoleCommand: {
            permission: 'console.write',
            handler: (admin: AuthedAdminType, command: string) => {
                if(typeof command !== 'string' || !command) return;
                const sanitized = command.replaceAll(/\n/g, ' ');
                admin.logCommand(sanitized);
                txCore.fxRunner.sendRawCommand(sanitized, admin.name);
                txCore.fxRunner.sendEvent('consoleCommand', {
                    channel: 'txAdmin',
                    command: sanitized,
                    author: admin.name,
                });
            }
        },
    },
} satisfies RoomType;
