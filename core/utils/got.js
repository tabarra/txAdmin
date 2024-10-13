import { convars, txEnv } from '@core/globalData';
import got from 'got';

export default got.extend({
    timeout: {
        request: 5000
    },
    headers: {
        'User-Agent': `txAdmin ${txEnv.txAdminVersion}`,
    },
    localAddress: convars.forceInterface ? convars.forceInterface : undefined,
});
