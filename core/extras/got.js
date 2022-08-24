import got from 'got';

//This requires GlobalData to be set before being called
let _got;
export default () => {
    if (!_got) {
        if (typeof GlobalData === 'undefined') {
            throw new Error('cannot instantiate got before GlobalData is set.');
        }
        _got = got.extend({
            timeout: 5000,
            headers: {
                'User-Agent': `txAdmin ${GlobalData.txAdminVersion}`,
            },
            localAddress: GlobalData.forceInterface ? GlobalData.forceInterface : undefined,
        });
    }
    return _got;
};
