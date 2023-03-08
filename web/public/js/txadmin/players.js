//================================================================
//============================================== Playerlist
//================================================================
//Vars and elements
let currServerMutex = false;
let cachedPlayers = [];
let biggestPlayerID = 0;
const playerlistElement = document.getElementById('playerlist');
const plistMsgElement = document.getElementById('playerlist-message');
const plistCountElement = document.getElementById('plist-count');
const plistSearchElement = document.getElementById('plist-search');

//Apply filter
function applyPlayerlistFilter() {
    let search = plistSearchElement.value.toLowerCase();
    Array.from(playerlistElement.children).forEach((el) => {
        if (el.id === 'playerlist-message') return;
        if (
            search == ''
            || (typeof el.dataset['pname'] == 'string' && el.dataset['pname'].includes(search))
        ) {
            el.hidden = false;
        } else {
            el.hidden = true;
        }
    });
}

//Search function
if (plistSearchElement) plistSearchElement.addEventListener('input', function (ev) {
    applyPlayerlistFilter();
});

//TODO: try this again, currently doesn't feel a very polished experience
// Clear search when the user clicks away
// plistSearchElement.addEventListener('focusout', (event) => {
//     setTimeout(() => {
//         event.target.value = ''
//         Array.from(playerlistElement.children).forEach(el => {
//             if(el.id == 'playerlist-message') return;
//             el.hidden = false;
//         });
//     }, 1000);
// });

//Handle Remove, Add and Update playerlist
function removePlayer(player) {
    document.getElementById(`divPlayer${player.netid}`).remove();
}

function addPlayer(player) {
    if (player.netid > biggestPlayerID) biggestPlayerID = player.netid;
    let div = `<div class="list-group-item list-group-item-accent-secondary player text-truncate" 
                onclick="showPlayerByMutexNetid('${currServerMutex}_${player.netid}')" id="divPlayer${player.netid}">
                    <span class="pping"> ---- </span>
                    <span class="pname">${xss(player.displayName)}</span>
            </div>`;
    $('#playerlist').append(div);
}

function updatePlayer(player) {
    let el = document.getElementById(`divPlayer${player.netid}`);
    let pingClass = 'secondary'; //hardcoded, no more ping data

    el.classList.remove('list-group-item-accent-secondary', 'list-group-item-accent-success', 'list-group-item-accent-warning', 'list-group-item-accent-danger');
    el.classList.add('list-group-item-accent-' + pingClass);
    el.firstElementChild.classList.remove('text-secondary', 'text-success', 'text-warning', 'text-danger');
    const padSize = biggestPlayerID.toString().length + 2;
    el.firstElementChild.innerHTML = `[${player.netid}]`.padStart(padSize, 'x').replace(/x/g, '&nbsp;');
    el.lastElementChild.textContent = player.displayName;
    el.dataset['pname'] = player.pureName;
}


function processPlayers(players, mutex) {
    //If invalid playerlist or error message
    if (!Array.isArray(players)) {
        Array.from(playerlistElement.children).forEach((el) => el.hidden = true);
        if (typeof players == 'string') {
            plistMsgElement.textContent = players;
        } else if (players === false) {
            plistMsgElement.textContent = 'Playerlist not available.';
        } else {
            plistMsgElement.textContent = 'Invalid playerlist';
        }
        plistMsgElement.hidden = false;
        return;
    }
    plistMsgElement.hidden = true;
    applyPlayerlistFilter();
    currServerMutex = mutex;

    let newPlayers, removedPlayers, updatedPlayers;
    try {
        newPlayers = players.filter((p) => {
            return !cachedPlayers.filter((x) => x.netid === p.netid).length;
        });

        removedPlayers = cachedPlayers.filter((p) => {
            return !players.filter((x) => x.netid === p.netid).length;
        });

        updatedPlayers = cachedPlayers.filter((p) => {
            return players.filter((x) => x.netid === p.netid).length;
        });
    } catch (error) {
        console.log(`Failed to process the playerlist with message: ${error.message}`);
    }

    removedPlayers.forEach(removePlayer);
    newPlayers.forEach(addPlayer);
    updatedPlayers.forEach(updatePlayer);

    if (!players.length) {
        plistMsgElement.hidden = false;
        plistMsgElement.innerText = `No Players Online.`;
    }
    cachedPlayers = players;
    plistCountElement.textContent = players.length;
}



//================================================================
//============================================ Player Actions HTML
//================================================================
function dbActionToHtml(action, permsDisableWarn, permsDisableBan, serverTime) {
    let revokeButton = '';
    if (!permsDisableBan) {
        if (
            action.revokedBy ||
            (action.type == 'warn' && permsDisableWarn) ||
            (action.type == 'ban' && permsDisableBan)
        ) {
            revokeButton = `&nbsp;<span class="badge badge-outline-light btn-inline-sm txActionsBtn">REVOKE</span>`;
        } else {
            revokeButton = `&nbsp;<button onclick="revokeAction('${xss(action.id)}', true)" 
                    class="btn btn-secondary btn-inline-sm txActionsBtn">REVOKE</button>`;
        }
    }
    const reason = (action.reason) ? xss(action.reason) : '';
    const actionDate = (new Date(action.ts * 1000)).toLocaleString();

    let footerNote, actionColor, actionMessage;
    if (action.type == 'ban') {
        actionColor = 'danger';
        actionMessage = `BANNED by ${xss(action.author)}`;
    } else if (action.type == 'warn') {
        actionColor = 'warning';
        actionMessage = `WARNED by ${xss(action.author)}`;
    }
    if (action.revokedBy) {
        actionColor = 'dark';
        footerNote = `Revoked by ${action.revokedBy}.`;
    }
    if (typeof action.exp == 'number') {
        const expirationDate = (new Date(action.exp * 1000)).toLocaleString();
        footerNote = (action.exp < serverTime) ? `Expired at ${expirationDate}.` : `Expires at ${expirationDate}.`;
    }
    const footerNoteHtml = (footerNote) ? `<small class="d-block">${footerNote}</small>` : '';

    return `<div class="list-group-item list-group-item-accent-${xss(actionColor)} logEntry">
        <div class="d-flex w-100 justify-content-between">
            <strong>${actionMessage}</strong>
            <small class="text-right">
                <span class="text-monospace font-weight-bold">(${xss(action.id)})</span>
                ${xss(actionDate)}
                ${revokeButton}
            </small>
        </div>
        <span>${reason}</span>
        ${footerNoteHtml}
    </div>`;
}

//================================================================
//============================================== Player Info Modal
//================================================================
//Preparing variables
const modPlayer = {
    currPlayerRef: false,
    currPlayerRefString: false,
    Modal: new coreui.Modal(document.getElementById('modPlayer')),
    Title: document.getElementById('modPlayerTitle'),
    Message: document.getElementById('modPlayerMessage'),
    Content: document.getElementById('modPlayerContent'),
    Buttons: {
        message: document.getElementById('modPlayerButtons-message'),
        kick: document.getElementById('modPlayerButtons-kick'),
        warn: document.getElementById('modPlayerButtons-warn'),
    },
    Main: {
        body: document.getElementById('modPlayerMain'),
        tab: document.getElementById('modPlayerMain-tab'),
        joinDate: document.getElementById('modPlayerMain-joinDate'),
        playTime: document.getElementById('modPlayerMain-playTime'),
        sessionTimeDiv: document.getElementById('modPlayerMain-sessionTimeDiv'),
        sessionTimeText: document.getElementById('modPlayerMain-sessionTimeText'),
        lastConnectionDiv: document.getElementById('modPlayerMain-lastConnectionDiv'),
        lastConnectionText: document.getElementById('modPlayerMain-lastConnectionText'),
        whitelisted: document.getElementById('modPlayerMain-whitelisted'),
        whitelistAddBtn: document.getElementById('modPlayerMain-whitelistAddBtn'),
        whitelistRemoveBtn: document.getElementById('modPlayerMain-whitelistRemoveBtn'),
        logCountBans: document.getElementById('modPlayerMain-logCountBans'),
        logCountWarns: document.getElementById('modPlayerMain-logCountWarns'),
        logDetailsBtn: document.getElementById('modPlayerMain-logDetailsBtn'),
        notesLog: document.getElementById('modPlayerMain-notesLog'),
        notes: document.getElementById('modPlayerMain-notes'),
    },
    IDs: {
        body: document.getElementById('modPlayerIDs'),
        tab: document.getElementById('modPlayerIDs-tab'),
        currList: document.getElementById('modPlayerIDs-currList'),
        oldList: document.getElementById('modPlayerIDs-oldList'),
    },
    History: {
        body: document.getElementById('modPlayerHistory'),
        tab: document.getElementById('modPlayerHistory-tab'),
        list: document.getElementById('modPlayerHistory-log'),
    },
    Ban: {
        body: document.getElementById('modPlayerBan'),
        tab: document.getElementById('modPlayerBan-tab'),
        reason: document.getElementById('modPlayerBan-reason'),
        durationSelect: document.getElementById('modPlayerBan-durationSelect'),
        durationMultiplier: document.getElementById('modPlayerBan-durationMultiplier'),
        durationUnit: document.getElementById('modPlayerBan-durationUnit'),
    },
};

function tsToLocaleDate(ts) {
    return new Date(ts * 1000)
        .toLocaleDateString(
            navigator.language,
            { dateStyle: 'long' }
        );
}

// Open Modal
function showPlayerByMutexNetid(mutexNetid) {
    const [mutex, netid] = mutexNetid.split(/[_#]/, 2);
    return showPlayer({ mutex, netid });
}
function showPlayerByLicense(license) {
    return showPlayer({ license });
}
function showPlayer(playerRef, keepTabSelection = false) {
    //Reset active player
    modPlayer.currPlayerRef = playerRef;
    modPlayer.currPlayerRefString = new URLSearchParams(modPlayer.currPlayerRef).toString();

    //Reset modal
    modPlayer.Message.innerHTML = SPINNER_HTML;
    modPlayer.Message.classList.remove('d-none');
    modPlayer.Content.classList.add('d-none');
    modPlayer.Title.innerText = 'loading...';

    //Reset tab selection
    if (!keepTabSelection) {
        modPlayer.Main.tab.classList.add('active');
        modPlayer.Main.body.classList.add('show', 'active');
        modPlayer.IDs.tab.classList.remove('active');
        modPlayer.IDs.body.classList.remove('show', 'active');
        modPlayer.History.tab.classList.remove('active');
        modPlayer.History.body.classList.remove('show', 'active');
        modPlayer.Ban.tab.classList.remove('nav-link-red', 'active');
        modPlayer.Ban.body.classList.remove('show', 'active');
    }
    modPlayer.Main.joinDate.innerText = '--';
    modPlayer.Main.playTime.innerText = '--';
    modPlayer.Main.sessionTimeText.innerText = '--';
    modPlayer.Main.sessionTimeDiv.classList.add('d-none');
    modPlayer.Main.lastConnectionText.innerText = '--';
    modPlayer.Main.lastConnectionDiv.classList.add('d-none');
    modPlayer.Main.whitelisted.innerText = '--';
    modPlayer.Main.whitelistAddBtn.classList.add('d-none');
    modPlayer.Main.whitelistRemoveBtn.classList.add('d-none');
    modPlayer.Main.logCountBans.innerText = '--';
    modPlayer.Main.logCountBans.classList.remove('text-danger');
    modPlayer.Main.logCountWarns.innerText = '--';
    modPlayer.Main.logCountWarns.classList.remove('text-warning');

    modPlayer.Main.notesLog.innerText = '--';
    modPlayer.Main.notes.value = 'cannot set notes for players that are not registered';
    modPlayer.Main.notes.disabled = true;

    modPlayer.IDs.currList.innerText = 'loading...';
    modPlayer.IDs.oldList.innerText = 'loading...';
    modPlayer.History.list.innerText = 'loading...';

    modPlayer.Ban.tab.classList.add('nav-link-disabled', 'disabled');
    modPlayer.Ban.reason.value = '';
    modPlayer.Ban.durationSelect.value = '2 days';
    modPlayer.Ban.durationMultiplier.value = '';
    modPlayer.Ban.durationUnit.value = 'days';
    modPlayer.Ban.durationMultiplier.disabled = true;
    modPlayer.Ban.durationUnit.disabled = true;
    modPlayer.Buttons.message.disabled = true;
    modPlayer.Buttons.kick.disabled = true;
    modPlayer.Buttons.warn.disabled = true;
    modPlayer.Modal.show();

    //Perform request
    txAdminAPI({
        type: 'GET',
        url: `/player?${modPlayer.currPlayerRefString}`,
        success: function (data) {
            if (checkApiLogoutRefresh(data)) return;
            const { meta, player, error } = data;
            if (error) {
                modPlayer.Title.innerText = 'Error';
                modPlayer.Message.innerHTML = `<h4 class=text-danger>${xss(error)}</h4>`;
                return;
            }

            //Setting modal fields
            modPlayer.Title.innerText = `[${player.netid || 'OFFLINE'}] ${player.displayName}`;
            if (player.isConnected) {
                if (Array.isArray(player.ids) && player.ids.length) {
                    modPlayer.IDs.currList.innerHTML = player.ids
                        .map(id => `<div class="idsText border-dark">${xss(id)}</div>`)
                        .join('\n');
                } else {
                    modPlayer.IDs.currList.innerHTML = '<em class="text-secondary">This player has no identifiers.</em>';
                }

                modPlayer.Main.sessionTimeText.innerText = msToDuration(
                    player.sessionTime * 60_000,
                    { units: ['h', 'm'] }
                );
                modPlayer.Main.sessionTimeDiv.classList.remove('d-none');
            }else{
                modPlayer.IDs.currList.innerHTML = '<em class="text-secondary">Player offline.</em>';
            }
            if (player.isRegistered) {
                modPlayer.Main.joinDate.innerText = tsToLocaleDate(player.tsJoined);
                modPlayer.Main.playTime.innerText = msToDuration(
                    player.playTime * 60_000,
                    { units: ['d', 'h', 'm'] }
                );
                if (!player.isConnected) {
                    modPlayer.Main.lastConnectionText.innerText = tsToLocaleDate(player.tsLastConnection);;
                    modPlayer.Main.lastConnectionDiv.classList.remove('d-none');
                }

                //Old identifiers
                if (Array.isArray(player.oldIds)) {
                    const filteredIds = player.oldIds
                        .filter(id => !player.isConnected || !player.ids.includes(id)) //don't filter when offline
                        .map(id => `<div class="idsText border-dark text-muted">${xss(id)}</div>`)
                        .join('\n');
                    modPlayer.IDs.oldList.innerHTML = (filteredIds.length)
                        ? filteredIds
                        : '<em class="text-secondary">No previous ID to show.</em>';
                } else {
                    modPlayer.IDs.oldList.innerHTML = '<em class="text-secondary">No previous ID to show.</em>';
                }

                //Whitelist
                if (player.tsWhitelisted) {
                    modPlayer.Main.whitelisted.innerText = tsToLocaleDate(player.tsWhitelisted);
                    if (meta.tmpPerms.whitelist) {
                        modPlayer.Main.whitelistRemoveBtn.classList.remove('d-none');
                    }
                } else {
                    modPlayer.Main.whitelisted.innerText = 'not yet';
                    if (meta.tmpPerms.whitelist) {
                        modPlayer.Main.whitelistAddBtn.classList.remove('d-none');
                    }
                }

                //Notes
                modPlayer.Main.notes.disabled = false;
                if (player.notes && player.notesLog) {
                    modPlayer.Main.notesLog.innerText = player.notesLog;
                    modPlayer.Main.notes.value = player.notes;
                } else {
                    modPlayer.Main.notes.value = '';
                }
            }

            //Enabling/disabling features
            modPlayer.Buttons.message.disabled = !(meta.tmpPerms.message && player.isConnected);
            modPlayer.Buttons.kick.disabled = !(meta.tmpPerms.kick && player.isConnected);
            modPlayer.Buttons.warn.disabled = !(meta.tmpPerms.warn && player.isConnected && player.isRegistered);
            if (meta.tmpPerms.ban && player.isRegistered) {
                modPlayer.Ban.tab.classList.add('nav-link-red');
                modPlayer.Ban.tab.classList.remove('nav-link-disabled', 'disabled');
            }

            if (!Array.isArray(player.actionHistory) || !player.actionHistory.length) {
                modPlayer.History.list.innerHTML = '<h4 class="pt-3 text-secondary">No bans/warns found.</h4>';
            } else {
                player.actionHistory.reverse();
                const counts = { ban: 0, warn: 0 };
                let logElements = [];
                for (const action of player.actionHistory) {
                    counts[action.type]++;
                    logElements.push(dbActionToHtml(action, !meta.tmpPerms.warn, !meta.tmpPerms.ban, meta.serverTime));
                }
                modPlayer.History.list.innerHTML = [
                    `<div class="list-group list-group-accent thin-scroll scrollBox">`,
                    ...logElements,
                    `</div>`
                ].join('\n');

                modPlayer.Main.logCountBans.innerText = (counts.ban === 1) ? '1 ban' : `${counts.ban} bans`;
                if (counts.ban) modPlayer.Main.logCountBans.classList.add('text-danger');
                modPlayer.Main.logCountWarns.innerText = (counts.warn === 1) ? '1 warn' : `${counts.warn} warns`;
                if (counts.warn) modPlayer.Main.logCountWarns.classList.add('text-warning');
            }

            //Show modal body
            modPlayer.Content.classList.remove('d-none');
            modPlayer.Message.classList.add('d-none');
        },
        error: function (xmlhttprequest, textstatus, message) {
            modPlayer.Title.innerText = 'error';
            modPlayer.Content.classList.add('d-none');
            modPlayer.Message.classList.remove('d-none');
            modPlayer.Message.innerText = `Error loading player info:\n${message}`;
        },
    });
}


/**
 * Player note functions
 */
function setNoteMessage(msg, type) {
    if (typeof type == 'string') {
        modPlayer.Main.notesLog.innerHTML = `<span class="text-${type}">${msg}</span>`;
    } else {
        modPlayer.Main.notesLog.innerText = msg;
    }
}
modPlayer.Main.notes.addEventListener('keydown', (event) => {
    setNoteMessage('Press enter to save.');
    if (event.keyCode == 13 && !event.shiftKey) {
        event.preventDefault();
        setNoteMessage('Saving...', 'warning');
        txAdminAPI({
            type: 'POST',
            url: `/player/save_note?${modPlayer.currPlayerRefString}`,
            timeout: REQ_TIMEOUT_LONG,
            data: { note: modPlayer.Main.notes.value },
            success: function (data) {
                if (data.success === true) {
                    setNoteMessage('Note saved.', 'success');
                } else {
                    setNoteMessage(data.error || 'unknown error', 'danger');
                }
            },
            error: function (xmlhttprequest, textstatus, message) {
                setNoteMessage(`Failed to save: ${message}`, 'danger');
            },
        });
    }
});


/**
 * Player whitelist function
 */
function setPlayerWhitelistStatus(status) {
    const notify = $.notify({ message: '<p class="text-center">Saving...</p>' }, {});
    txAdminAPI({
        type: "POST",
        url: `/player/whitelist?${modPlayer.currPlayerRefString}`,
        timeout: REQ_TIMEOUT_LONG,
        data: { status },
        success: function (data) {
            notify.update('progress', 0);
            if (data.success === true) {
                notify.update('type', 'success');
                notify.update('message', 'Whitelist status changed.');
                showPlayer(modPlayer.currPlayerRef);
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
modPlayer.Main.whitelistAddBtn.addEventListener('click', (event) => {
    setPlayerWhitelistStatus(true);
});
modPlayer.Main.whitelistRemoveBtn.addEventListener('click', (event) => {
    setPlayerWhitelistStatus(false);
});


/**
 * Warn Player
 */
async function warnPlayer() {
    if (!modPlayer.currPlayerRefString) return;
    modPlayer.Modal.hide(); //otherwise we cannot type
    const reason = await txAdminPrompt({
        modalColor: 'orange',
        confirmBtnClass: 'btn-orange',
        title: 'Warn Player',
        description: 'Type the warn reason.',
    });
    if (reason === false) return;
    if (!reason.length) {
        return $.notify({ message: '<p class="text-center">The warn reason is required.</p>' }, { type: 'danger' });
    }
    const notify = $.notify({ message: '<p class="text-center">Executing Command...</p>' }, {});

    txAdminAPI({
        type: 'POST',
        url: `/player/warn?${modPlayer.currPlayerRefString}`,
        timeout: REQ_TIMEOUT_LONG,
        data: { reason: reason },
        success: function (data) {
            notify.update('progress', 0);
            if (data.success === true) {
                notify.update('type', 'success');
                notify.update('message', 'Player warned.');
                modPlayer.Modal.hide();
            } else {
                notify.update('type', 'danger');
                notify.update('message', data.error || 'unknown error');
            }
        },
        error: function (xmlhttprequest, textstatus, message) {
            notify.update('progress', 0);
            notify.update('type', 'danger');
            notify.update('message', message);
        },
    });
}


/**
 * Ban Player functions
 */
modPlayer.Ban.durationSelect.onchange = () => {
    const isDefault = (modPlayer.Ban.durationSelect.value !== 'custom');
    modPlayer.Ban.durationMultiplier.disabled = isDefault;
    modPlayer.Ban.durationUnit.disabled = isDefault;
};

function banPlayer() {
    if (!modPlayer.currPlayerRefString) return;
    const reason = modPlayer.Ban.reason.value.trim();
    if (!reason.length) {
        $.notify({ message: '<p class="text-center">The ban reason is required.</p>' }, { type: 'danger' });
        return;
    }
    const duration = modPlayer.Ban.durationSelect.value === 'custom'
        ? `${modPlayer.Ban.durationMultiplier.value} ${modPlayer.Ban.durationUnit.value}`
        : modPlayer.Ban.durationSelect.value;

    const notify = $.notify({ message: '<p class="text-center">Executing Command...</p>' }, {});
    const data = {
        reason,
        duration,
    };
    txAdminAPI({
        type: 'POST',
        url: `/player/ban?${modPlayer.currPlayerRefString}`,
        timeout: REQ_TIMEOUT_LONG,
        data: data,
        success: function (data) {
            notify.update('progress', 0);
            if (data.success === true) {
                notify.update('type', 'success');
                notify.update('message', 'Player banned.');
                modPlayer.Modal.hide();
            } else {
                notify.update('type', 'danger');
                notify.update('message', data.error || 'unknown error');
            }
        },
        error: function (xmlhttprequest, textstatus, message) {
            notify.update('progress', 0);
            notify.update('type', 'danger');
            notify.update('message', message);
        },
    });
}



/**
 * Revoke action
 * NOTE: also used in the players page
 */
function revokeAction(action_id, isModal = false) {
    if (!action_id) {
        return $.notify({ message: 'Invalid actionID' }, { type: 'danger' });
    }

    const notify = $.notify({ message: '<p class="text-center">Revoking...</p>' }, {});
    txAdminAPI({
        type: "POST",
        url: '/database/revoke_action',
        timeout: REQ_TIMEOUT_LONG,
        data: { action_id },
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



/**
 * Message/DM Player
 */
async function messagePlayer() {
    if (!modPlayer.currPlayerRefString) return;
    modPlayer.Modal.hide();
    const message = await txAdminPrompt({
        title: 'Direct Message',
        description: 'Type direct message below:',
    });
    if (message === false) return;
    if (!message.length) {
        return $.notify({ message: '<p class="text-center">The DM message is required.</p>' }, { type: 'danger' });
    }

    const notify = $.notify({ message: '<p class="text-center">Executing Command...</p>' }, {});

    txAdminAPI({
        type: 'POST',
        url: `/player/message?${modPlayer.currPlayerRefString}`,
        timeout: REQ_TIMEOUT_LONG,
        data: { message: message.trim() },
        success: function (data) {
            if (data.success === true) {
                notify.update('type', 'success');
                notify.update('message', 'Direct message sent.');
            } else {
                notify.update('type', 'danger');
                notify.update('message', data.error || 'unknown error');
            }
            notify.update('progress', 0);
        },
        error: function (xmlhttprequest, textstatus, message) {
            notify.update('progress', 0);
            notify.update('type', 'danger');
            notify.update('message', message);
        },
    });
}


/**
 * Kick player
 */
async function kickPlayer() {
    if (!modPlayer.currPlayerRefString) return;
    modPlayer.Modal.hide();
    const reason = await txAdminPrompt({
        modalColor: 'red',
        confirmBtnClass: 'btn-red',
        title: 'Kick Player',
        description: 'Type the kick reason or leave it blank (press enter)',
        required: false,
    });
    if (reason === false) return;

    const notify = $.notify({ message: '<p class="text-center">Executing Command...</p>' }, {});

    txAdminAPI({
        type: 'POST',
        url: `/player/kick?${modPlayer.currPlayerRefString}`,
        timeout: REQ_TIMEOUT_LONG,
        data: { reason: reason.trim() },
        success: function (data) {
            if (data.success === true) {
                notify.update('type', 'success');
                notify.update('message', 'Player kicked.');
            } else {
                notify.update('type', 'danger');
                notify.update('message', data.error || 'unknown error');
            }
            notify.update('progress', 0);
        },
        error: function (xmlhttprequest, textstatus, message) {
            notify.update('progress', 0);
            notify.update('type', 'danger');
            notify.update('message', message);
        },
    });
}


/**
 * Other stuff
 */
modPlayer.Main.logDetailsBtn.addEventListener('click', (event) => {
    modPlayer.History.tab.click();
});
