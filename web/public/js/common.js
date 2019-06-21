//================================================================
//============================================== Dynamic Stats
//================================================================
function refreshData() {
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
    alert('not implemented yet')
}
function kickPlayer(id) {
    alert('not implemented yet')
}



