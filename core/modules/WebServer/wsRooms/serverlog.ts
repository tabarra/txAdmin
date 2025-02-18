import type { RoomType } from "../webSocket";

/**
 * The console room is responsible for the server log page
 */
export default {
    permission: true, //everyone can see it
    eventName: 'logData',
    cumulativeBuffer: true,
    outBuffer: [],
    initialData: () => txCore.logger.server.getRecentBuffer(500),
    commands: {},
} satisfies RoomType;
