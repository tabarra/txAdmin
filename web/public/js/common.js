//================================================================
//============================================== Settings
//================================================================
const timeoutShort = 1500;
const timeoutMedium = 2500;
const timeoutLong = 4000;

//================================================================
//============================================== Dynamic Stats
//================================================================
const getPlayerListMessage = (m) => {
    return `<div class="list-group-item text-center">
        <span class="p-3 text-center font-weight-bold">${m}</span>
    </div>`;
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
            if(data.players.count){
                $("#playerlist").html(data.players.html);
                $("#plist-count").text(data.players.count);
            }else{
                $("#plist-count").text(data.players.count);
                $("#playerlist").html(getPlayerListMessage('No Players Online'));
            }
            $("#favicon").attr("href", 'img/' + data.meta.favicon + ".png");
            document.title = data.meta.title;
        },
        error: function (xmlhttprequest, textstatus, message) {
            let out = null;
            if (textstatus == 'parsererror') {
                out = `Response parse error.\n<br>Try refreshing your window.`;
            } else {
                out = `Request error: ${textstatus}\n<br>${message}`;
            }
            $('#hostusage-cpu-bar').attr('aria-valuenow', 0).css('width', 0);
            $('#hostusage-cpu-text').html('error');
            $('#hostusage-memory-bar').attr('aria-valuenow', 0).css('width', 0);
            $('#hostusage-memory-text').html('error');
            $("#status-card").html(out);
            $("#playerlist").html(getPlayerListMessage(out));
            $("#favicon").attr("href", "img/favicon_off.png");
            document.title = 'ERROR - txAdmin';
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
            $("#modPlayerInfoTitle").html(data.name);
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
