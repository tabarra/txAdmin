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
                onclick="showPlayer(${player.id})" id="divPlayer${player.id}">
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
function showPlayer(id) {
    $("#modPlayerInfoTitle").html('loading...');
    $("#modPlayerInfoIdentifiers").html('loading...');
    $("#modPlayerInfoButtons").html('<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>');

    $('#modPlayerInfo').modal('show');
    $.ajax({
        url: "/getPlayerData/" + id,
        type: "GET",
        dataType: "json",
        timeout: timeoutMedium,
        success: function (data) {
            if (data.logout) {
                window.location = '/auth?logout';
                return;
            }
            $("#modPlayerInfoTitle").text(data.name);
            $("#modPlayerInfoIdentifiers").html(data.identifiers);
            $("#modPlayerInfoButtons").html(data.buttons);
        },
        error: function (xmlhttprequest, textstatus, message) {
            $("#modPlayerInfoTitle").html('error');
            $("#modPlayerInfoIdentifiers").html('error');
        }
    });
}


function messagePlayer(id) {
    $('#modPlayerInfo').modal('hide');
    let message = prompt('Type your message');
    if(!message || message.length === 0) return;

    var notify = $.notify({ message: '<p class="text-center">Executing Command...</p>'}, {});

    let data = {
        action: 'admin_dm',
        parameter: [id, message]
    }
    $.ajax({
        type: "POST",
        url: '/fxserver/commands',
        timeout: timeoutLong,
        data: data,
        // dataType: 'json',
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


function kickPlayer(id) {
    $('#modPlayerInfo').modal('hide');
    let reason = prompt('Type the kick reason or leave it blank (press enter)');
    if(reason == null) return;

    var notify = $.notify({ message: '<p class="text-center">Executing Command...</p>'}, {});

    let data = {
        action: 'kick_player',
        parameter: [id, reason]
    }
    $.ajax({
        type: "POST",
        url: '/fxserver/commands',
        timeout: timeoutLong,
        data: data,
        // dataType: 'json',
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
