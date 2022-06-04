const got = require('got');

//Make sure this file is not included before GlobalData is set
//doing so would poison the configuration due to node's modules cache
if (typeof GlobalData === 'undefined') {
    throw new Error('cannot instantiate got before GlobalData is set.');
}

module.exports = got.extend({
    timeout: 5000,
    headers: {
        'User-Agent': `txAdmin ${GlobalData.txAdminVersion}`,
    },
    localAddress: GlobalData.forceInterface ? GlobalData.forceInterface : undefined,
});
