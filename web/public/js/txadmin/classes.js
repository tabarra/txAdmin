
export class txPlayers {

  // note message
  noteMessage(msg, type) {
    if (typeof type == "string") {
      modPlayer.Main.notesLog.innerHTML = `<span class="text-${type}">${msg}</span>`;
    } else {
      modPlayer.Main.notesLog.innerText = msg;
    }
  }

  // message player
  messagePlayer() {
    if (modPlayer.curr.id == false) return;
    const message = prompt("Type your message.");
    if (!message || message.length === 0) return;

    const notify = $.notify(
      { message: '<p class="text-center">Executing Command...</p>' },
      { type: 'info' }
    );

    const data = {
      id: modPlayer.curr.id,
      message: message.trim(),
    };
    $.ajax({
      type: "POST",
      url: "/player/message",
      timeout: timeoutLong,
      data: data,
      dataType: "json",
      success: function (data) {
        notify.update("progress", 0);
        notify.update("type", data.type);
        notify.update("message", data.message);
      },
      error: function (xmlhttprequest, textstatus, message) {
        notify.update("progress", 0);
        notify.update("type", "danger");
        notify.update("message", message);
      },
    });
  }

  // kick player
  kick() {
    if (modPlayer.curr.id == false) return;
    const reason = prompt("Type the kick reason or leave it blank (press enter)");
    if (reason == null) return;

    var notify = $.notify(
      { message: '<p class="text-center">Executing Command...</p>' },
      { type: 'info' }
    );

    let data = {
      id: modPlayer.curr.id,
      reason: reason,
    };
    $.ajax({
      type: "POST",
      url: "/player/kick",
      timeout: timeoutLong,
      data: data,
      dataType: "json",
      success: function (data) {
        notify.update("progress", 0);
        notify.update("type", data.type);
        notify.update("message", data.message);
        if (data.type !== "danger") modPlayer.Modal.hide();
      },
      error: function (xmlhttprequest, textstatus, message) {
        notify.update("progress", 0);
        notify.update("type", "danger");
        notify.update("message", message);
      },
    });
  }

  // ban player
  banPlayer() {
    const reason = modPlayer.Ban.reason.value.trim();
  if (!reason.length) {
    $.notify(
      { message: '<p class="text-center">The ban reason is required.</p>' },
      { type: "danger" }
    );
    return;
  }
  const duration =
    modPlayer.Ban.durationSelect.value === "custom"
      ? `${modPlayer.Ban.durationMultiplier.value} ${modPlayer.Ban.durationUnit.value}`
      : modPlayer.Ban.durationSelect.value;

    const notify = $.notify(
      { message: '<p class="text-center">Executing Command...</p>' },
      {}
    );
    const data = {
      reason,
      duration,
      reference:
        modPlayer.curr.id !== false
          ? modPlayer.curr.id
          : modPlayer.curr.identifiers,
      // reference: modPlayer.curr.identifiers,
    };
    $.ajax({
      type: "POST",
      url: "/player/ban",
      timeout: timeoutLong,
      data: data,
      dataType: "json",
      success: function (data) {
        notify.update("progress", 0);
        notify.update("type", data.type);
        notify.update("message", data.message);
        if (data.type !== "danger") modPlayer.Modal.hide();
      },
      error: function (xmlhttprequest, textstatus, message) {
        notify.update("progress", 0);
        notify.update("type", "danger");
        notify.update("message", message);
      },
    });
  }

  // warn player
  warnPlayer() {
    if (modPlayer.curr.id == false) return;
    let reason = prompt("Type the warn reason.");
    if (reason == null) return;
    reason = reason.trim();

    if (!reason.length) {
      var notify = $.notify(
        { message: '<p class="text-center">The warn reason is required.</p>' },
        { type: "danger" }
      );
      return;
    }

    var notify = $.notify(
      { message: '<p class="text-center">Executing Command...</p>' },
      {type: 'info'}
    );

    let data = {
      id: modPlayer.curr.id,
      reason: reason,
    };

    $.ajax({
      type: "POST",
      url: "/player/warn",
      timeout: timeoutLong,
      data: data,
      dataType: "json",
      success: function (data) {
        notify.update("progress", 0);
        notify.update("type", data.type);
        notify.update("message", data.message);
        if (data.type !== "danger") modPlayer.Modal.hide();
      },
      error: function (xmlhttprequest, textstatus, message) {
        notify.update("progress", 0);
        notify.update("type", "danger");
        notify.update("message", message);
      },
    });
  }
}

export let modPlayer = {
  curr: {
    id: false,
    license: false,
    identifiers: false,
  },
  Modal: new coreui.Modal(document.getElementById("modPlayer")),
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
    body: document.getElementById("modPlayerMain"),
    tab: document.getElementById("modPlayerMain-tab"),
    joinDate: document.getElementById("modPlayerMain-joinDate"),
    playTime: document.getElementById("modPlayerMain-playTime"),
    sessionTime: document.getElementById("modPlayerMain-sessionTime"),
    notesLog: document.getElementById("modPlayerMain-notesLog"),
    notes: document.getElementById("modPlayerMain-notes"),
  },
  IDs: {
    body: document.getElementById("modPlayerIDs"),
    tab: document.getElementById("modPlayerIDs-tab"),
    list: document.getElementById("modPlayerIDs-list"),
  },
  History: {
    body: document.getElementById("modPlayerHistory"),
    tab: document.getElementById("modPlayerHistory-tab"),
    list: document.getElementById("modPlayerHistory-log"),
  },
  Ban: {
    body: document.getElementById("modPlayerBan"),
    tab: document.getElementById("modPlayerBan-tab"),
    reason: document.getElementById("modPlayerBan-reason"),
    durationSelect: document.getElementById("modPlayerBan-durationSelect"),
    durationMultiplier: document.getElementById(
      "modPlayerBan-durationMultiplier"
    ),
    durationUnit: document.getElementById("modPlayerBan-durationUnit"),
  }
}
