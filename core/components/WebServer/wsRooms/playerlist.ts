const modulename = 'SocketRoom:Playerlist';
import TxAdmin from "@core/txAdmin";
import { RoomType } from "../webSocket";
import consoleFactory from '@extras/console';
import { FullPlayerlistEventType } from "@shared/socketioTypes";
const console = consoleFactory(modulename);


/**
 * The the playerlist room is joined on all (except solo) pages when in web mode
 */
export default (txAdmin: TxAdmin): RoomType => ({
    permission: true, //everyone can see it
    eventName: 'playerlist',
    cumulativeBuffer: true,
    outBuffer: [],
    initialData: () => {
        return [{
            mutex: txAdmin.fxRunner.currentMutex,
            type: 'fullPlayerlist',
            playerlist: txAdmin.playerlistManager.getPlayerList(),
        } satisfies FullPlayerlistEventType];
    },
})
