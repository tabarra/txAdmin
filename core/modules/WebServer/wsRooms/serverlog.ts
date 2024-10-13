import TxAdmin from "@core/txAdmin";
import { RoomType } from "../webSocket";

/**
 * The console room is responsible for the server log page
 */
export default (txAdmin: TxAdmin): RoomType => ({
    permission: true, //everyone can see it
    eventName: 'logData',
    cumulativeBuffer: true,
    outBuffer: [],
    initialData: () => txAdmin.logger.server.getRecentBuffer(500),
    commands: {},
})
