import { RoomType } from "../webSocket";


/**
 * The main room is joined automatically in every txadmin page (except solo ones)
 * It relays tx and server status data.
 * 
 * NOTE: 
 * - active push event for HealthMonitor, HostData, fxserver process
 * - passive update for discord status, scheduler
 * - the passive ones will be sent every 5 seconds anyways due to HostData updates
 */
export default {
    permission: true, //everyone can see it
    eventName: 'status',
    cumulativeBuffer: false,
    outBuffer: null,
    initialData: () => {
        return txManager.globalStatus;
    },
} satisfies RoomType;
