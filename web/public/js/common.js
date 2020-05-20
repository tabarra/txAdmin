// FIXME: Remove jQuery, we really don't need it

//================================================================
//============================================== Settings
//================================================================
const timeoutShort = 1500;
const timeoutMedium = 2500;
const timeoutLong = 4000;

//================================================================
//============================================== Dynamic Stats
//================================================================
//Vars and elements
let cachedPlayers = [];
let playerlistElement = document.getElementById('playerlist');
let plistMsgElement = document.getElementById('playerlist-message');
let plistCountElement = document.getElementById('plist-count');
let plistSearchElement = document.getElementById('plist-search');

//Apply filter
function applyPlayerlistFilter(){
    let search = plistSearchElement.value.toLowerCase();
    Array.from(playerlistElement.children).forEach(el => {
        if(el.id == 'playerlist-message') return;
        if(
            search == '' || 
            (typeof el.dataset['pname'] == 'string' && el.dataset['pname'].includes(search))
        ){
            el.hidden = false;
        }else{
            el.hidden = true;
        }
    });
}

//Search function
plistSearchElement.addEventListener('input', function (ev) {
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
function removePlayer(player){
    document.getElementById(`divPlayer${player.id}`).remove();
}

function addPlayer(player){
    let div = `<div class="list-group-item list-group-item-accent-secondary player text-truncate" 
                onclick="showPlayer('${player.license}')" id="divPlayer${player.id}">
                    <span class="pping text-secondary">&nbsp;??</span>
                    <span class="pname">#${player.id}</span>
            </div>`
    $("#playerlist").append(div);
}

function updatePlayer(player){
    let el = document.getElementById(`divPlayer${player.id}`);

    let pingClass;
    player.ping = parseInt(player.ping);
    if (player.ping < 0) {
        pingClass = 'secondary';
        player.ping = '??';
    } else if (player.ping < 60) {
        pingClass = 'success';
    } else if (player.ping < 100) {
        pingClass = 'warning';
    } else {
        pingClass = 'danger';
    }

    el.classList.remove('list-group-item-accent-secondary', 'list-group-item-accent-success', 'list-group-item-accent-warning', 'list-group-item-accent-danger');
    el.classList.add('list-group-item-accent-' + pingClass);
    el.firstElementChild.classList.remove('text-secondary', 'text-success', 'text-warning', 'text-danger');
    el.firstElementChild.classList.add('text-' + pingClass);
    el.firstElementChild.innerHTML = player.ping.toString().padStart(3, 'x').replace(/x/g, '&nbsp;');
    el.lastElementChild.textContent = player.name;
    el.dataset['pname'] = player.name.toLowerCase();
}


function processPlayers(players) {
    //If invalid playerlist or error message
    if(!Array.isArray(players)){
        Array.from(playerlistElement.children).forEach(el => el.hidden = true);
        if(typeof players == 'string'){
            plistMsgElement.textContent = players;
        }else if(players === false){
            plistMsgElement.textContent = 'Playerlist not available.';
        }else{
            plistMsgElement.textContent = 'Invalid playerlist';
        }
        plistMsgElement.hidden = false
        return;
    }
    plistMsgElement.hidden = true;
    applyPlayerlistFilter();
    
    let newPlayers, removedPlayers, updatedPlayers;
    try {
        newPlayers = players.filter(p => {
            return !cachedPlayers.filter(x => x.id === p.id).length;
        });
        
        removedPlayers = cachedPlayers.filter(p => {
            return !players.filter(x => x.id === p.id).length;
        });

        updatedPlayers = cachedPlayers.filter(p => {
            return players.filter(x => x.id === p.id).length;
        });
    } catch (error) {
        console.log(`Failed to process the playerlist with message: ${error.message}`);
    }

    removedPlayers.forEach(removePlayer);
    newPlayers.forEach(addPlayer);
    updatedPlayers.forEach(updatePlayer);

    if(!players.length){
        plistMsgElement.hidden = false
        plistMsgElement.textContent = 'No Players Online';
    }
    cachedPlayers = players;
    plistCountElement.textContent = players.length;
}



function refreshData() {
    $.ajax({
        url: "/status",
        type: "GET",
        dataType: "json",
        timeout: timeoutShort,
        success: function (data) {
            if (data.logout) {
                window.location = '/auth?logout';
                return;
            }
            $('#hostusage-cpu-bar').attr('aria-valuenow', data.host.cpu.pct).css('width', data.host.cpu.pct+"%");
            $('#hostusage-cpu-text').html(data.host.cpu.text);
            $('#hostusage-memory-bar').attr('aria-valuenow', data.host.memory.pct).css('width', data.host.memory.pct+"%");
            $('#hostusage-memory-text').html(data.host.memory.text);
            $("#status-card").html(data.status);
            $("#favicon").attr("href", 'img/' + data.meta.favicon + ".png");
            document.title = data.meta.title;
            processPlayers(data.players)
        },
        error: function (xmlhttprequest, textstatus, message) {
            let out = null;
            if (textstatus == 'parsererror') {
                out = `Response parse error.\nTry refreshing your window.`;
            } else {
                out = `Request error: ${textstatus}\n${message}`;
            }
            $('#hostusage-cpu-bar').attr('aria-valuenow', 0).css('width', 0);
            $('#hostusage-cpu-text').html('error');
            $('#hostusage-memory-bar').attr('aria-valuenow', 0).css('width', 0);
            $('#hostusage-memory-text').html('error');
            $("#status-card").html(out.replace('\n', '\n<br>'));
            $("#favicon").attr("href", "img/favicon_offline.png");
            document.title = 'ERROR - txAdmin';
            processPlayers(out)
        }
    });
};



//================================================================
//============================================== Player Info Modal
//================================================================
//Preparing variables
var spinnerHTML = '<div class="txSpinner">Loading...</div>';
var modPlayer = {
    curr: {
        id: false,
        license: false,
        identifiers: false,
    },
    Modal: new coreui.Modal(document.getElementById('modPlayer')),
    Title: document.getElementById("modPlayerTitle"),
    Message: document.getElementById("modPlayerMessage"),
    Content: document.getElementById("modPlayerContent"),
    Buttons: {
        search: document.getElementById("modPlayerButtons-search"),
        message: document.getElementById("modPlayerButtons-message"),
        kick: document.getElementById("modPlayerButtons-kick"),
        warn: document.getElementById("modPlayerButtons-warn"),
    },
    Main: {
        joinDate: document.getElementById("modPlayerMain-joinDate"),
        playTime: document.getElementById("modPlayerMain-playTime"),
        sessionTime: document.getElementById("modPlayerMain-sessionTime"),
        notesLog: document.getElementById("modPlayerMain-notesLog"),
        notes: document.getElementById("modPlayerMain-notes"),
    },
    IDs: {
        list: document.getElementById("modPlayerIDs-list")
    },
    History: {
        list: document.getElementById("modPlayerHistory-log")
    },
    Ban: {
        tab: document.getElementById("modPlayerBan-tab"),
        reason: document.getElementById("modPlayerBan-reason"),
        duration: document.getElementById("modPlayerBan-duration"),
    }
}


// Open Modal
function showPlayer(license) {
    //Reset active player
    modPlayer.curr.id = false;
    modPlayer.curr.license = false;
    modPlayer.curr.identifiers = false;

    //Reset modal
    modPlayer.Message.innerHTML = spinnerHTML;
    modPlayer.Message.classList.remove('d-none');
    modPlayer.Content.classList.add('d-none');
    modPlayer.Title.innerText = 'loading...';
    modPlayer.Main.joinDate.innerText = '--';
    modPlayer.Main.playTime.innerText = '--';
    modPlayer.Main.sessionTime.innerText = '--';
    modPlayer.Main.notesLog.innerText = '--';
    modPlayer.Main.notes.value = '';
    modPlayer.IDs.list.innerText = 'loading...';
    modPlayer.History.list.innerText = 'loading...';

    modPlayer.Ban.tab.classList.add('nav-link-disabled', 'disabled');
    modPlayer.Ban.tab.classList.remove('nav-link-red');

    modPlayer.Ban.reason.value = '';
    modPlayer.Ban.duration.value = '2d';
    modPlayer.Buttons.search.disabled = true;
    modPlayer.Buttons.message.disabled = true;
    modPlayer.Buttons.kick.disabled = true;
    modPlayer.Buttons.warn.disabled = true;
    modPlayer.Modal.show();

    //Perform request
    $.ajax({
        url: "/player/" + license,
        type: "GET",
        dataType: "json",
        timeout: timeoutMedium,
        success: function (data) {
            if (data.logout) {
                window.location = '/auth?logout';
                return;
            }
            modPlayer.curr.id = data.id;
            modPlayer.curr.license = data.license;
            modPlayer.curr.identifiers = data.identifiers;
            modPlayer.Title.innerText = data.name;

            modPlayer.Main.joinDate.innerText = data.joinDate;
            modPlayer.Main.playTime.innerText = data.playTime;
            modPlayer.Main.sessionTime.innerText = data.sessionTime;
            modPlayer.Main.notesLog.innerText = data.notesLog;
            modPlayer.Main.notes.disabled = data.isTmp;
            modPlayer.Main.notes.value = data.notes;
            modPlayer.IDs.list.innerText = data.identifiers.join(',\n');
            modPlayer.History.list.innerText = 'fix me :p'; //FIXME:
            // <div class="list-group-item list-group-item-accent-info player-history-entry">
            //     [02/02]<strong>[UNBAN]</strong>
            //         lorem ipsum (tabarra)
            // </div>
            // <div class="text-center text-info">
            //     For more events, click on the Search button below.
            // </div>
            
            modPlayer.Buttons.search.disabled = false;
            modPlayer.Buttons.message.disabled = data.funcDisabled.message;
            modPlayer.Buttons.kick.disabled = data.funcDisabled.kick;
            modPlayer.Buttons.warn.disabled = data.funcDisabled.warn;
            
            //TODO: Show message disabling ban form if the user is already banned?
            //      Or maybe just warn "this user is already banned"
            if(!data.funcDisabled.ban){
                modPlayer.Ban.tab.classList.add('nav-link-red');
                modPlayer.Ban.tab.classList.remove('nav-link-disabled', 'disabled');
            }

            modPlayer.Content.classList.remove('d-none');
            modPlayer.Message.classList.add('d-none');
        },
        error: function (xmlhttprequest, textstatus, message) {
            modPlayer.Title.innerText = 'error';
            modPlayer.Content.classList.add('d-none');
            modPlayer.Message.classList.remove('d-none');
            modPlayer.Message.innerText = `Error loading player info:\n${message}`;
        }
    });
}


// Save Note
function setNoteMessage(msg, type){
    if(typeof type == 'string'){
        modPlayer.Main.notesLog.innerHTML = `<span class="text-${type}">${msg}</span>`;
    }else{
        modPlayer.Main.notesLog.innerText = msg;
    }
}
modPlayer.Main.notes.addEventListener("keydown", (event) => {
    setNoteMessage(`Press enter to save.`);
    if (event.keyCode == 13 && !event.shiftKey) {
        event.preventDefault();
        setNoteMessage(`Saving...`, 'warning');
        var data = {
            license: modPlayer.curr.license,
            note: modPlayer.Main.notes.value
        }
        $.ajax({
            type: "POST",
            url: '/player/save_note',
            timeout: timeoutLong,
            data: data,
            dataType: 'json',
            success: function (data) {
                if(typeof data.message == 'string' && typeof data.type == 'string'){
                    setNoteMessage(data.message,  data.type);
                }else{
                    setNoteMessage(`Failed to save with error: wrong return format`, 'danger');
                }
                
            },
            error: function (xmlhttprequest, textstatus, message) {
                setNoteMessage(`Failed to save with error: ${message}`, 'danger');
            }
        });
    }
});


// Redirect to player search page
function searchPlayer() {
    modPlayer.Modal.hide();
    if(modPlayer.curr.identifiers == false) return;
    //TODO: //TODO: //TODO: //TODO: //TODO: //TODO: //TODO: //TODO:    
}


// Message player
function messagePlayer() {
    if(modPlayer.curr.id == false) return;
    let message = prompt('Type your message.');
    if(!message || message.length === 0) return;

    var notify = $.notify({ message: '<p class="text-center">Executing Command...</p>'}, {});

    let data = {
        id: modPlayer.curr.id,
        message: message.trim()
    }
    $.ajax({
        type: "POST",
        url: '/player/message',
        timeout: timeoutLong,
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
        }
    });
}

// Kick Player
function kickPlayer() {
    if(modPlayer.curr.id == false) return;
    let reason = prompt('Type the kick reason or leave it blank (press enter)');
    if(reason == null) return;

    var notify = $.notify({ message: '<p class="text-center">Executing Command...</p>'}, {});

    let data = {
        id: modPlayer.curr.id,
        reason: reason
    }
    $.ajax({
        type: "POST",
        url: '/player/kick',
        timeout: timeoutLong,
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
        }
    });
}

//Warn Player
function warnPlayer() {
    if(modPlayer.curr.id == false) return;
    let reason = prompt('Type the warn reason.');
    if(reason == null) return;
    reason = reason.trim();

    if (!reason.length) {
        var notify = $.notify({ message: '<p class="text-center">The warn reason is required.</p>'}, {type: 'danger'});
        return;
    }
    var notify = $.notify({ message: '<p class="text-center">Executing Command...</p>'}, {});

    let data = {
        id: modPlayer.curr.id,
        reason: reason
    }
    $.ajax({
        type: "POST",
        url: '/player/warn',
        timeout: timeoutLong,
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
        }
    });
}

// Ban Player
function banPlayer() {
    //TODO: //TODO: //TODO: //TODO: //TODO: //TODO: //TODO: //TODO: 
    return;
    modPlayer.Modal.hide();
    if(modPlayer.curr.identifiers == false) return;
    let reason = prompt('Type your warn reason');
    if(reason == null) return;

    var notify = $.notify({ message: '<p class="text-center">Executing Command...</p>'}, {});

    let data = {
        action: 'warn_player', //FIXME: flatten this
        parameter: [modPlayer.curr.id, reason]
    }
    $.ajax({
        type: "POST",
        url: '/fxserver/commands',
        timeout: timeoutLong,
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
        }
    });
}



//================================================================
//========================================== Change Password Modal
//================================================================
function changeOwnPasswordModal() {
    $('#modChangePassword').modal('show');
}

$('#modChangePassword-save').click(function () {
    let data = {
        newPassword: $('#modChangePassword-newPassword').val().trim(),
        confirmPassword: $('#modChangePassword-confirmPassword').val().trim()
    }

    //Validity Checking
    let errors = [];
    if (!data.newPassword.length || !data.confirmPassword.length) {
        errors.push('The new password fields are required.');
    }
    if(data.newPassword !== data.confirmPassword){
        errors.push(`Your new password doesn't match the one typed in the confirmation input.`);
    }
    if(typeof isTempPassword === 'undefined'){
        data.oldPassword = $('#modChangePassword-oldPassword').val().trim();
        if (!data.oldPassword.length) {
            errors.push('The old password field is required.');
        }
        if(data.oldPassword === data.confirmPassword){
            errors.push(`The new password must be different than the old one.`);
        }
    }
    if(data.newPassword.length < 6 || data.newPassword.length > 24){
        errors.push(`The new password have between 6 and 24 characters.`);
    }
    if(errors.length){
        var notify = $.notify({ message: '<b>Errors:</b><br> - ' + errors.join(' <br>\n - ') }, { type: 'warning' });
        return;
    }

    var notify = $.notify({ message: '<p class="text-center">Saving...</p>' }, {});

    $.ajax({
        type: "POST",
        url: '/changePassword',
        timeout: timeoutMedium,
        data: data,
        dataType: 'json',
        success: function (data) {
            notify.update('progress', 0);
            notify.update('type', data.type);
            notify.update('message', data.message);
            if(data.type == 'success'){
                $('#modChangePassword').modal('hide');
                setTimeout(() => {
                    $('#modChangePassword-save').hide()
                    $('#modChangePassword-body').html('<h4 class="mx-auto" style="max-width: 350px">password already changed, please refresh this page</h4>');
                }, 500);
            }
        },
        error: function (xmlhttprequest, textstatus, message) {
            notify.update('progress', 0);
            notify.update('type', 'danger');
            notify.update('message', message);
            $('#modChangePassword').modal('hide');
        }
    });
});



//================================================================
//========================================== Extra stuff
//================================================================
//Page load
$(document).ready(function() {
    $.notifyDefaults({
        z_index: 2000,
        mouse_over: 'pause',
        placement: {
            align: 'center'
        },
        offset: {
            y: 64
        },
    });
    setInterval(refreshData, 1000);

    if(typeof isTempPassword !== 'undefined'){
        $('#modChangePassword-oldPassword').attr('disabled', true);
        $('#modChangePassword-oldPassword').attr('required', false);
        $('#modChangePassword').modal('show');
    }
});

//Handle profile picture load error
$(".profile-pic").on("error", function() {
    if($(this).attr('src') != 'img/default_avatar.png'){
        $(this).attr('src', 'img/default_avatar.png');
    }
});
