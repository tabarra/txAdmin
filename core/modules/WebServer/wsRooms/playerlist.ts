const modulename = 'SocketRoom:Playerlist';
import { RoomType } from "../webSocket";
import consoleFactory from '@lib/console';
import { FullPlayerlistEventType } from "@shared/socketioTypes";
const console = consoleFactory(modulename);


/**
 * The the playerlist room is joined on all (except solo) pages when in web mode
 */
export default {
    permission: true, //everyone can see it
    eventName: 'playerlist',
    cumulativeBuffer: true,
    outBuffer: [],
    initialData: () => {
        return [{
            mutex: txCore.fxRunner.currentMutex,
            type: 'fullPlayerlist',
            playerlist: txCore.playerlistManager.getPlayerList(),
        } satisfies FullPlayerlistEventType];
    },
} satisfies RoomType;
