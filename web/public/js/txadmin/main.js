/* eslint-disable no-unused-vars */
//================================================================
//================================================= Helper funcs
//================================================================
const msToDuration = humanizeDuration.humanizer({
    round: true,
});
const msToShortDuration = humanizeDuration.humanizer({
    round: true,
    spacer: '',
    language: 'shortEn',
});


//================================================================
//===================================== Ports from old players.js
//================================================================
// Open Modal
function showPlayerByMutexNetid(mutexNetid) {
    const [mutex, netid] = mutexNetid.split(/[_#]/, 2);
    return window.parent.postMessage({ type: 'openPlayerModal', ref: { mutex, netid } });
}
function showPlayerByLicense(license) {
    return window.parent.postMessage({ type: 'openPlayerModal', ref: { license } });
}

// Revokes an action
function revokeAction(actionId, isModal = false) {
    if (!actionId) {
        return $.notify({ message: 'Invalid actionID' }, { type: 'danger' });
    }

    const notify = $.notify({ message: '<p class="text-center">Revoking...</p>' }, {});
    txAdminAPI({
        type: "POST",
        url: '/database/revoke_action',
        timeout: REQ_TIMEOUT_LONG,
        data: { actionId },
        success: function (data) {
            notify.update('progress', 0);
            if (data.success === true) {
                notify.update('type', 'success');
                notify.update('message', 'Action revoked.');
                if (isModal) {
                    showPlayer(modPlayer.currPlayerRef, true);
                } else {
                    window.location.reload(true);
                }
            } else {
                notify.update('type', 'danger');
                notify.update('message', data.error || 'unknown error');
            }
        },
        error: function (xmlhttprequest, textstatus, message) {
            notify.update('progress', 0);
            notify.update('type', 'danger');
            notify.update('message', message);
        }
    });
}


//================================================================
//=================================================== On Page Load
//================================================================
const getSocket = (rooms) => {
    const socketOpts = {
        transports: ['polling'],
        upgrade: false,
        query: { rooms }
    };

    const socket = isWebInterface
        ? io({ ...socketOpts, path: '/socket.io' })
        : io('monitor', { ...socketOpts, path: '/WebPipe/socket.io' });

    socket.on('logout', () => {
        console.log('Received logout command from websocket.');
        window.parent.postMessage({ type: 'logoutNotice' });
    });

    return socket;
}
