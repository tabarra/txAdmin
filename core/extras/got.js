import { convars, txEnv } from '@core/globalData.js';
import got from 'got';

export default got.extend({
    timeout: 5000,
    headers: {
        'User-Agent': `txAdmin ${txEnv.txAdminVersion}`,
    },
    localAddress: convars.forceInterface ? convars.forceInterface : undefined,
});
