const got = require('got');

const gotClient = got.extend({
    timeout: 5000,
    headers: {
        'User-Agent': `txAdmin ${GlobalData.txAdminVersion}`,
    },
    // localAddress: 'TODO',
});

module.exports = gotClient;
