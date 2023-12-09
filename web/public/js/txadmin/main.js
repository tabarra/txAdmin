/* eslint-disable no-unused-vars */
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

const startMainSocket = () => {
    if(!isWebInterface) return;
    const socket = getSocket(['playerlist']);
    socket.on('disconnect', (message) => {
        console.log("Main Socket.IO Disonnected:", message);
        if (isWebInterface) {
            setPlayerlistMessage('Page Disconnected 😓');
        }
    });
    socket.on('playerlist', function (playerlistData) {
        if(!isWebInterface) return;
        processPlayerlistEvents(playerlistData);
    });
}

document.addEventListener('DOMContentLoaded', function (event) {
    //Starting status/playerlist socket.io
    startMainSocket();
});
