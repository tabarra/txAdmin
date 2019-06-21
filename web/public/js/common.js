//================================================================
//============================================== Dynamic Stats
//================================================================
function refreshData() {
    // console.log('hellooo' + Math.random())
    $.ajax({
        url: "/getStatus",
        type: "GET",
        dataType: "json",
        timeout: 1500,
        success: function (data) {
            if (data.logout) {
                window.location = '/auth?logout';
                return;
            }
            $('#hostusage-cpu-bar').attr('aria-valuenow', data.host.cpu.pct).css('width', data.host.cpu.pct);
            $('#hostusage-cpu-text').html(data.host.cpu.text);
            $('#hostusage-memory-bar').attr('aria-valuenow', data.host.memory.pct).css('width', data.host.memory.pct);
            $('#hostusage-memory-text').html(data.host.memory.text);
            $("#status-card").html(data.status);
            $("#playerlist").html(data.players);
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
            $("#playerlist").html(out);
            $("#favicon").attr("href", "img/favicon_off.png");
            document.title = 'ERROR - txAdmin';
        }
    });
};

//Cron
setInterval(refreshData, 1000);



//================================================================
//============================================== Player Info Modal
//================================================================
function showPlayer(id) {
    $("#modPlayerInfoTitle").html('loading...');
    $("#modPlayerInfoIdentifiers").html('loading...');
    $("#modPlayerInfoButtons").html('<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>');

    $('#modPlayerInfo').modal('show')
    $.ajax({
        url: "/getPlayerData/" + id,
        type: "GET",
        dataType: "json",
        timeout: 2000,
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
    let message = prompt('Do something?');
    if(!message || message.length === 0) return;

    var notify = $.notify({ message: '<p class="text-center">Executing Command...</p>'}, {});

    let data = {
        action: 'admin_dm',
        parameter: [id, message]
    }
    $.ajax({
        type: "POST",
        url: '/fxCommands',
        timeout: 2000,
        data: data,
        // dataType: 'json',
        success: function (data) {
            notify.update('progress', 0);
            notify.update('type', 'warning');
            notify.update('message', data);
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
    var notify = $.notify({ message: '<p class="text-center">Executing Command...</p>'}, {});

    let data = {
        action: 'kick_player',
        parameter: id
    }
    $.ajax({
        type: "POST",
        url: '/fxCommands',
        timeout: 2000,
        data: data,
        // dataType: 'json',
        success: function (data) {
            notify.update('progress', 0);
            notify.update('type', 'warning');
            notify.update('message', data);
        },
        error: function (xmlhttprequest, textstatus, message) {
            notify.update('progress', 0);
            notify.update('type', 'danger');
            notify.update('message', message);
        }
    });
}



//jogar pra dentro do doc ready
$.notifyDefaults({
    mouse_over: 'pause',
    placement: {
        align: 'center'
    },
    offset: {
        y: 64
    },
});



// setTimeout(() => {
//     execThingmagoo()
// }, 500);



function execThingmagoo() {
    var notify = $.notify({
        // options
        message: '<p class="text-center">Executing command...</p>'
    }, {
            // settings
            // type: 'warning',
            allow_dismiss: false,
            delay: 0,
            mouse_over: 'pause',
            placement: {
                from: 'bottom',
                align: 'center'
            },
            offset: {
                y: 64
            },
            animate: {
                enter: 'animated fadeInUp',
                exit: 'animated fadeOutDown'
            },
        }
    );

    setTimeout(() => {
        notify.update('message', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.');
        setTimeout(() => {
            notify.close();
        }, 5000);
    }, 1000);
}




/*
function checkVersion(){
    $.getJSON( "/checkVersion", function( data ) {
        if(data.current !== data.latest){
            $("#bottom-links").hide();
            let out = `<small><strong>\n`;
            out += `<a href="https://github.com/tabarra/txAdmin">Update available for txAdmin (v${data.current} > v${data.latest})!</a>\n`;
            out += `</strong> <br/> \n`;
            out += `${data.changelog}</small>\n`;
            $("#update-me").html(out);
            $("#update-me").removeClass('d-none');
        }
    });
}

colocar os crons dentro do doc ready
$(document).ready(function() {
    checkVersion();
    setInterval(() => {
        refreshData();
    }, 1000);
});
*/
