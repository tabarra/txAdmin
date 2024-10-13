import TxAdmin from "@core/txAdmin";
import { RoomType } from "../webSocket";

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
            handler: txAdmin.fxRunner.liveConsoleCmdHandler,
        },
    },
})
