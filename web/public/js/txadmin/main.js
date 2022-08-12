/* eslint-disable no-unused-vars */
//================================================================
//============================================== Dynamic Stats
//================================================================
function refreshData() {
    const scope = (isWebInterface) ? 'web' : 'iframe';
    txAdminAPI({
        url: `status/${scope}`,
        type: 'GET',
        timeout: REQ_TIMEOUT_SHORT,
        success: function (data) {
            if (checkApiLogoutRefresh(data)) return;
            $('#status-card').html(data.status);
            if (isWebInterface) {
                $('#hostusage-cpu-bar').attr('aria-valuenow', data.host.cpu.pct).css('width', data.host.cpu.pct + '%');
                $('#hostusage-cpu-text').html(data.host.cpu.text);
                $('#hostusage-memory-bar').attr('aria-valuenow', data.host.memory.pct).css('width', data.host.memory.pct + '%');
                $('#hostusage-memory-text').html(data.host.memory.text);
                $('#favicon').attr('href', 'img/' + data.meta.favicon + '.png');
                document.title = data.meta.title;
                processPlayers(data.players);
            }
        },
        error: function (xmlhttprequest, textstatus, message) {
            let out = null;
            if (textstatus == 'parsererror') {
                out = 'Response parse error.\nTry refreshing your window.';
            } else {
                out = `Request error: ${textstatus}\n${message}`;
            }
            $('#status-card').html(out.replace('\n', '\n<br>'));
            if (isWebInterface) {
                $('#hostusage-cpu-bar').attr('aria-valuenow', 0).css('width', 0);
                $('#hostusage-cpu-text').html('error');
                $('#hostusage-memory-bar').attr('aria-valuenow', 0).css('width', 0);
                $('#hostusage-memory-text').html('error');
                $('#favicon').attr('href', 'img/favicon_offline.png');
                document.title = 'ERROR - txAdmin';
                processPlayers(out);
            }
        },
    });
};



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
        dataType: 'json',
        success: function (data) {
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
document.addEventListener('DOMContentLoaded', function (event) {
    //Setting up status refresh
    refreshData();
    setInterval(refreshData, STATUS_REFRESH_INTERVAL);

    //Opening modal
    if (typeof isTempPassword !== 'undefined') {
        $('#modChangePassword').modal('show');
    }
});


//================================================================
//=================================== Globally Available API Funcs
//================================================================
async function txApiFxserverControl(action) {
    const confirmOptions = { content: `Are you sure you would like to <b>${action}</b> the server?` };
    if (action !== 'start' && !await txAdminConfirm(confirmOptions)) {
        return;
    }
    const notify = $.notify({ message: '<p class="text-center">Executing Command...</p>' }, {});
    txAdminAPI({
        url: '/fxserver/controls/' + action,
        type: 'GET',
        dataType: 'json',
        timeout: REQ_TIMEOUT_LONG,
        success: function (data) {
            updateMarkdownNotification(data, notify);
        },
        error: function (xmlhttprequest, textstatus, message) {
            notify.update('progress', 0);
            notify.update('type', 'danger');
            notify.update('message', message);
        },
    });
}
