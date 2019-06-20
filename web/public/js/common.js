

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
            $("#card-status").html(out);
            $("#playerlist").html(out);
            $("#favicon").attr("href", "favicon_off.png");
            document.title = 'ERROR - txAdmin';
        }
    });
};


function showPlayer(id){
    alert(id)
    // $.get("ajax/pinfo.php", function (data) {
    //     // $("#modPlayerInfo").html(data);
    //     $('#modPlayerInfo').modal('show')
    // });
}


setInterval(() => {
    refreshData();
}, 1000);
