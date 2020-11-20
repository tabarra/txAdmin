
export class txPlayers {

  noteMessage(msg, type) {
    if (typeof type == "string") {
      modPlayer.Main.notesLog.innerHTML = `<span class="text-${type}">${msg}</span>`;
    } else {
      modPlayer.Main.notesLog.innerText = msg;
    }
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