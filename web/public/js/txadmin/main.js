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
//============================================== Dynamic Stats
//================================================================
const faviconEl = document.getElementById('favicon');
const statusCard = {
    self: document.getElementById('status-card'),
    discord: document.getElementById('status-discord'),
    server: document.getElementById('status-server'),
    serverProcess: document.getElementById('status-serverProcess'),
    nextRestartTime: document.getElementById('status-nextRestartTime'),
    nextRestartBtnCancel: document.getElementById('status-nextRestartBtnCancel'),
    nextRestartBtnEnable: document.getElementById('status-nextRestartBtnEnable'),
};

const setBadgeColor = (el, color) => {
    const targetColorClass = `badge-${color}`;
    if (!el.classList.contains(targetColorClass)) {
        el.classList.remove('badge-primary', 'badge-secondary', 'badge-success', 'badge-danger', 'badge-warning', 'badge-info', 'badge-light', 'badge-dark');
        el.classList.add(targetColorClass);
    }
};
const setNextRestartTimeClass = (cssClass) => {
    const el = statusCard.nextRestartTime;
    if (!el.classList.contains(cssClass)) {
        el.classList.remove('font-weight-light', 'text-warning', 'text-muted');
        el.classList.add(cssClass);
    }
};

const updateStatusCard = (discordData, serverData) => {
    if(!statusCard.self) return;

    setBadgeColor(statusCard.discord, discordData.statusClass);
    statusCard.discord.textContent = discordData.status;
    setBadgeColor(statusCard.server, serverData.statusClass);
    statusCard.server.textContent = serverData.status;
    statusCard.serverProcess.textContent = serverData.process;

    if (typeof serverData.scheduler.nextRelativeMs !== 'number') {
        setNextRestartTimeClass('font-weight-light');
        statusCard.nextRestartTime.textContent = 'not scheduled';
    } else {
        const tempFlag = (serverData.scheduler.nextIsTemp)? '(tmp)' : '';
        const relativeTime = msToDuration(serverData.scheduler.nextRelativeMs, {units: ['h', 'm']});
        const isLessThanMinute = serverData.scheduler.nextRelativeMs < 60_000;
        if(isLessThanMinute){
            statusCard.nextRestartTime.textContent = `right now ${tempFlag}`;
            statusCard.nextRestartBtnCancel.classList.add('d-none');
            statusCard.nextRestartBtnEnable.classList.add('d-none');
        }else{
            statusCard.nextRestartTime.textContent = `in ${relativeTime} ${tempFlag}`;
        }

        if (serverData.scheduler.nextSkip) {
            setNextRestartTimeClass('text-muted');
            if(!isLessThanMinute) {
                statusCard.nextRestartBtnCancel.classList.add('d-none');
                statusCard.nextRestartBtnEnable.classList.remove('d-none');
            }
        } else {
            setNextRestartTimeClass('text-warning');
            if(!isLessThanMinute) {
                statusCard.nextRestartBtnCancel.classList.remove('d-none');
                statusCard.nextRestartBtnEnable.classList.add('d-none');
            }
        }
    }
};

const updatePageTitle = (serverStatusClass, serverName, playerCount) => {
    if(!isWebInterface) return;
    
    const pageName = PAGE_TITLE || 'txAdmin';
    document.title = `(${playerCount}) ${serverName} | ${pageName}`;

    let iconType = 'default';
    if (serverStatusClass === 'success') {
        iconType = 'online';
    } else if (serverStatusClass === 'warning') {
        iconType = 'partial';
    } else if (serverStatusClass === 'danger') {
        iconType = 'offline';
    }
    faviconEl.href = `img/favicon_${iconType}.png`;
};

const updateHostStats = (hostData) => {
    if(!isWebInterface) return;
    
    $('#hostusage-cpu-bar').attr('aria-valuenow', hostData.cpu.pct).css('width', hostData.cpu.pct + '%');
    $('#hostusage-cpu-text').html(hostData.cpu.text);
    $('#hostusage-memory-bar').attr('aria-valuenow', hostData.memory.pct).css('width', hostData.memory.pct + '%');
    $('#hostusage-memory-text').html(hostData.memory.text);
};

function refreshData() {
    const scope = (isWebInterface) ? 'web' : 'iframe';
    txAdminAPI({
        type: 'GET',
        url: `status/${scope}`,
        timeout: REQ_TIMEOUT_SHORT,
        success: function (data) {
            if (checkApiLogoutRefresh(data)) return;
            updateStatusCard(data.discord, data.server);
            if (isWebInterface) {
                updatePageTitle(data.server.statusClass, data.server.name, data.players.length);
                updateHostStats(data.host);
                processPlayers(data.players, data.server.mutex);
            }
        },
        error: function (xmlhttprequest, textstatus, message) {
            let out = null;
            if (textstatus == 'parsererror') {
                out = 'Response parse error.\nTry refreshing your window.';
            } else {
                out = `Request error: ${textstatus}\n${message}`;
            }
            if (statusCard.self) {
                setBadgeColor(statusCard.discord, 'light');
                statusCard.discord.textContent = '--';
                setBadgeColor(statusCard.server, 'light');
                statusCard.server.textContent = '--';
                statusCard.serverProcess.textContent = '--';
                setNextRestartTimeClass('text-muted');
                statusCard.nextRestartTime.textContent = '--';
                statusCard.nextRestartBtnCancel.classList.add('d-none');
                statusCard.nextRestartBtnEnable.classList.add('d-none');
            }
            if (isWebInterface) {
                $('#hostusage-cpu-bar').attr('aria-valuenow', 0).css('width', 0);
                $('#hostusage-cpu-text').html('error');
                $('#hostusage-memory-bar').attr('aria-valuenow', 0).css('width', 0);
                $('#hostusage-memory-text').html('error');
                document.title = 'ERROR - txAdmin';
                faviconEl.href = `img/favicon_offline.png`;
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
    const confirmOptions = { content: `Are you sure you would like to <b>${action.toUpperCase()}</b> the server?` };
    if (action !== 'start' && !await txAdminConfirm(confirmOptions)) {
        return;
    }
    const notify = $.notify({ message: '<p class="text-center">Executing Command...</p>' }, {});
    txAdminAPI({
        url: '/fxserver/controls',
        type: 'POST',
        data: {action},
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
