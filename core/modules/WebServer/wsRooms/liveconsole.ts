import TxAdmin from "@core/txAdmin";
import { RoomType } from "../webSocket";
import { AuthedAdminType } from "../authLogic";


/**
 * The console room is responsible for the server live console page
 */
export default (txAdmin: TxAdmin): RoomType => ({
    permission: 'console.view',
    eventName: 'consoleData',
    cumulativeBuffer: true,
    outBuffer: '',
    initialData: () => txAdmin.logger.fxserver.getRecentBuffer(),
    commands: {
        consoleCommand: {
            permission: 'console.write',
            handler: (admin: AuthedAdminType, command: string) => {
                if(typeof command !== 'string' || !command) return;
                const sanitized = command.replaceAll(/\n/g, ' ');
                admin.logCommand(sanitized);
                txAdmin.fxRunner.sendRawCommand(sanitized, admin.name);
            }
        },
    },
})
