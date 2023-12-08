/* eslint-disable no-unused-vars */
//================================================================
//========================================== Change Password Modal
//================================================================
function changeOwnPasswordModal() {
    $('#modChangePassword').modal('show');
}

document.getElementById('modChangePassword-save').onclick = (e) => {
    const form = {
        newPassword: $('#modChangePassword-newPassword').val().trim(),
        confirmPassword: $('#modChangePassword-confirmPassword').val().trim(),
    };

    //Validity Checking
    const errors = [];
    if (!form.newPassword.length || !form.confirmPassword.length) {
        errors.push('The new password fields are required.');
    }
    if (form.newPassword !== form.confirmPassword) {
        errors.push('Your new password doesn\'t match the one typed in the confirmation input.');
    }
    if (typeof isTempPassword === 'undefined') {
        form.oldPassword = $('#modChangePassword-oldPassword').val().trim();
        if (!form.oldPassword.length) {
            errors.push('The old password field is required.');
        }
        if (form.oldPassword === form.confirmPassword) {
            errors.push('The new password must be different than the old one.');
        }
    }
    if (form.newPassword.length < 6 || form.newPassword.length > 24) {
        errors.push('The new password has to be between 6 and 24 characters.');
    }
    if (errors.length) {
        return $.notify({ message: '<b>Error(s):</b><br> - ' + errors.join(' <br>\n - ') }, { type: 'warning' });
    }

    const notify = $.notify({ message: '<p class="text-center">Saving...</p>' }, {});
    txAdminAPI({
        type: 'POST',
        url: '/changePassword',
        data: form,
        success: function (data) {
            if (checkApiLogoutRefresh(data)) return;
            notify.update('progress', 0);
            notify.update('type', data.type);
            notify.update('message', data.message);
            if (data.type == 'success') {
                $('#modChangePassword').modal('hide');
                setTimeout(() => {
                    $('#modChangePassword-save').hide();
                    $('#modChangePassword-body').html('<h4 class="mx-auto" style="max-width: 350px">password already changed, please refresh this page</h4>');
                }, 500);
            }
        },
        error: function (xmlhttprequest, textstatus, message) {
            notify.update('progress', 0);
            notify.update('type', 'danger');
            notify.update('message', message);
            $('#modChangePassword').modal('hide');
        },
    });
};


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

    //Opening modal
    if (typeof isTempPassword !== 'undefined') {
        $('#modChangePassword').modal('show');
    }
});
