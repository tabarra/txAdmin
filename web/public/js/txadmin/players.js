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
function dbActionToHtml(action, permsDisableWarn, permsDisableBan, serverTime){
    let revokeButton = '';
    if(!permsDisableBan){
        if(
            action.revokedBy ||
            (action.type == 'warn' && permsDisableWarn) ||
            (action.type == 'ban' && permsDisableBan)
        ){
            revokeButton = `&nbsp;<span class="badge badge-outline-light btn-inline-sm txActionsBtn">REVOKE</span>`; 
        }else{
            revokeButton = `&nbsp;<button onclick="revokeAction('${xss(action.id)}')" 
                    class="btn btn-secondary btn-inline-sm txActionsBtn">REVOKE</button>`; 
        }
    }
    const reason = (action.reason)? xss(action.reason) : '';
    const actionDate = (new Date(action.ts * 1000)).toLocaleString()

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
    const footerNoteHtml = (footerNote)? `<small class="d-block">${footerNote}</small>` : '';

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
        search: document.getElementById('modPlayerButtons-search'),
        message: document.getElementById('modPlayerButtons-message'),
        kick: document.getElementById('modPlayerButtons-kick'),
        warn: document.getElementById('modPlayerButtons-warn'),
    },
    Main: {
        body: document.getElementById('modPlayerMain'),
        tab: document.getElementById('modPlayerMain-tab'),
        joinDate: document.getElementById('modPlayerMain-joinDate'),
        playTime: document.getElementById('modPlayerMain-playTime'),
        sessionTime: document.getElementById('modPlayerMain-sessionTime'),
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
        list: document.getElementById('modPlayerIDs-list'),
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


// Open Modal
function showPlayerByMutexNetid(mutexNetid) {
    const [mutex, netid] = mutexNetid.split(/[_#]/, 2);
    return showPlayer({ mutex, netid });
}
function showPlayerByLicense(license) {
    return showPlayer({ license });
}
function showPlayer(playerRef) {
    //Reset active player
    modPlayer.currPlayerRef = playerRef;
    modPlayer.currPlayerRefString = new URLSearchParams(modPlayer.currPlayerRef).toString();

    //Reset modal
    modPlayer.Message.innerHTML = SPINNER_HTML;
    modPlayer.Message.classList.remove('d-none');
    modPlayer.Content.classList.add('d-none');
    modPlayer.Title.innerText = 'loading...';

    modPlayer.Main.tab.classList.add('active');
    modPlayer.Main.body.classList.add('show', 'active');
    modPlayer.Main.joinDate.innerText = '--';
    modPlayer.Main.playTime.innerText = '--';
    modPlayer.Main.sessionTime.innerText = '--';

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

    modPlayer.IDs.tab.classList.remove('active');
    modPlayer.IDs.body.classList.remove('show', 'active');
    modPlayer.IDs.list.innerText = 'loading...';

    modPlayer.History.tab.classList.remove('active');
    modPlayer.History.body.classList.remove('show', 'active');
    modPlayer.History.list.innerText = 'loading...';

    modPlayer.Ban.tab.classList.remove('nav-link-red', 'active');
    modPlayer.Ban.body.classList.remove('show', 'active');
    modPlayer.Ban.tab.classList.add('nav-link-disabled', 'disabled');

    modPlayer.Ban.reason.value = '';
    modPlayer.Ban.durationSelect.value = '2 days';
    modPlayer.Ban.durationMultiplier.value = '';
    modPlayer.Ban.durationUnit.value = 'days';
    modPlayer.Ban.durationMultiplier.disabled = true;
    modPlayer.Ban.durationUnit.disabled = true;
    modPlayer.Buttons.search.disabled = true;
    modPlayer.Buttons.message.disabled = true;
    modPlayer.Buttons.kick.disabled = true;
    modPlayer.Buttons.warn.disabled = true;
    modPlayer.Modal.show();

    //Perform request
    txAdminAPI({
        url: `/player?${modPlayer.currPlayerRefString}`,
        type: 'GET',
        dataType: 'json',
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
            if (Array.isArray(player.ids) && player.ids.length) {
                modPlayer.IDs.list.innerHTML = player.ids
                    .map(id => `<div class="idsText border-dark">${xss(id)}</div>`)
                    .join('\n');
            } else {
                modPlayer.IDs.list.innerHTML = '<h4 class="pt-3 text-secondary">This player has no identifiers.</h4>';
            }
            if (player.isConnected) {
                modPlayer.Main.sessionTime.innerText = msToDuration(
                    player.sessionTime * 60_000,
                    { units: ['h', 'm'] }
                );
            }
            if (player.isRegistered) {
                modPlayer.Main.joinDate.innerText = new Date(player.tsJoined * 1000)
                    .toLocaleDateString(
                        navigator.language,
                        { dateStyle: 'long' }
                    );
                modPlayer.Main.playTime.innerText = msToDuration(
                    player.playTime * 60_000,
                    { units: ['d', 'h', 'm'] }
                );

                //Whitelist
                if (!meta.onJoinCheckWhitelist) {
                    modPlayer.Main.whitelisted.innerText = 'feature disabled';
                } else if (player.tsWhitelisted) {
                    modPlayer.Main.whitelisted.innerText = new Date(player.tsJoined * 1000)
                        .toLocaleDateString(
                            navigator.language,
                            { dateStyle: 'long' }
                        );
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

            //FIXME: remover?
            // modPlayer.Buttons.search.disabled = false;

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
                    `<div class="list-group list-group-accent thin-scroll" style="overflow-y: scroll; max-height: 55vh;">`,
                    ...logElements,
                    `</div>`
                ].join('\n');

                modPlayer.Main.logCountBans.innerText = (counts.bans === 1) ? '1 ban' : `${counts.ban} bans`;
                if(counts.ban) modPlayer.Main.logCountBans.classList.add('text-danger');
                modPlayer.Main.logCountWarns.innerText = (counts.warns === 1) ? '1 warn' : `${counts.warn} warns`;
                if(counts.warn) modPlayer.Main.logCountWarns.classList.add('text-warning');
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


// Save Note
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
        const data = {
            note: modPlayer.Main.notes.value,
        };
        txAdminAPI({
            type: 'POST',
            url: '/player/save_note', //FIXME: modPlayer.currPlayerRefString
            timeout: REQ_TIMEOUT_LONG,
            data: data,
            dataType: 'json',
            success: function (data) {
                if (typeof data.message == 'string' && typeof data.type == 'string') {
                    setNoteMessage(data.message, data.type);
                } else {
                    setNoteMessage('Failed to save with error: wrong return format', 'danger');
                }
            },
            error: function (xmlhttprequest, textstatus, message) {
                setNoteMessage(`Failed to save with error: ${message}`, 'danger');
            },
        });
    }
});


modPlayer.Main.whitelistAddBtn.addEventListener('click', (event) => {
    alert('whitelistAddBtn');
});
modPlayer.Main.whitelistRemoveBtn.addEventListener('click', (event) => {
    alert('whitelistRemoveBtn');
});
modPlayer.Main.logDetailsBtn.addEventListener('click', (event) => {
    alert('logDetailsBtn');
});


// Redirect to player search page
function searchPlayer() {
    modPlayer.Modal.hide();
    if (!modPlayer.currPlayerRefString) return;
    //FIXME: usar modPlayer.currPlayerRefString
    const idsString = modPlayer.curr.ids.join(';');
    if (window.location.pathname == TX_BASE_PATH + '/player/list') {
        searchInput.value = idsString;
        performSearch();
    } else {
        window.location = TX_BASE_PATH + '/player/list#' + encodeURI(idsString);
    }
}


// Message player
async function messagePlayer() {
    if (!modPlayer.currPlayerRefString) return;
    modPlayer.Modal.hide();
    const message = await txAdminPrompt({
        title: 'Direct Message',
        description: 'Type direct message below:',
    });
    if (!message || message.length === 0) return;

    const notify = $.notify({ message: '<p class="text-center">Executing Command...</p>' }, {});

    let data = {
        message: message.trim(),
    };
    txAdminAPI({
        type: 'POST',
        url: '/player/message', //FIXME: usar modPlayer.currPlayerRefString
        timeout: REQ_TIMEOUT_LONG,
        data: data,
        dataType: 'json',
        success: function (data) {
            notify.update('progress', 0);
            notify.update('type', data.type);
            notify.update('message', data.message);
        },
        error: function (xmlhttprequest, textstatus, message) {
            notify.update('progress', 0);
            notify.update('type', 'danger');
            notify.update('message', message);
        },
    });
}

// Kick Player
async function kickPlayer() {
    //FIXME: o que fazer no caso de kick? pegar var do modPlayer.currPlayerRef ao invés de usar ref string?
    if (modPlayer.curr.netid == false) return;
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

    let data = {
        id: modPlayer.curr.netid,
        reason: reason,
    };
    txAdminAPI({
        type: 'POST',
        url: '/player/kick',
        timeout: REQ_TIMEOUT_LONG,
        data: data,
        dataType: 'json',
        success: function (data) {
            notify.update('progress', 0);
            notify.update('type', data.type);
            notify.update('message', data.message);
            if (data.type !== 'danger') modPlayer.Modal.hide();
        },
        error: function (xmlhttprequest, textstatus, message) {
            notify.update('progress', 0);
            notify.update('type', 'danger');
            notify.update('message', message);
        },
    });
}

//Warn Player
async function warnPlayer() {
    //FIXME: checar se está online
    if (!modPlayer.currPlayerRefString) return;
    modPlayer.Modal.hide();
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

    let data = {
        reason: reason,
    };
    txAdminAPI({
        type: 'POST',
        url: '/player/warn', //FIXME: usar modPlayer.currPlayerRefString
        timeout: REQ_TIMEOUT_LONG,
        data: data,
        dataType: 'json',
        success: function (data) {
            notify.update('progress', 0);
            notify.update('type', data.type);
            notify.update('message', data.message);
            if (data.type !== 'danger') modPlayer.Modal.hide();
        },
        error: function (xmlhttprequest, textstatus, message) {
            notify.update('progress', 0);
            notify.update('type', 'danger');
            notify.update('message', message);
        },
    });
}

// Ban Player
modPlayer.Ban.durationSelect.onchange = () => {
    const isDefault = (modPlayer.Ban.durationSelect.value !== 'custom');
    modPlayer.Ban.durationMultiplier.disabled = isDefault;
    modPlayer.Ban.durationUnit.disabled = isDefault;
};

function banPlayer() {
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
        reference: (modPlayer.curr.netid !== false) ? modPlayer.curr.netid : modPlayer.curr.ids,
        // reference: modPlayer.curr.ids,
    };
    //FIXME: usar modPlayer.currPlayerRefString
    txAdminAPI({
        type: 'POST',
        url: '/player/ban',
        timeout: REQ_TIMEOUT_LONG,
        data: data,
        dataType: 'json',
        success: function (data) {
            notify.update('progress', 0);
            notify.update('type', data.type);
            notify.update('message', data.message);
            if (data.type !== 'danger') modPlayer.Modal.hide();
        },
        error: function (xmlhttprequest, textstatus, message) {
            notify.update('progress', 0);
            notify.update('type', 'danger');
            notify.update('message', message);
        },
    });
}
