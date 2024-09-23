import { isBrowserEnv } from "./miscUtils";
import { debugData } from "./debugData";
import { PlayerData } from "../hooks/usePlayerListListener";
import { LocaleType } from "@shared/localeMap";
import { ServerCtx } from "../state/server.state";
import { SetWarnOpenData } from "../components/WarnPage/WarnPage";
import { AddAnnounceData } from "../hooks/useHudListenersService";
import { mockPlayerData } from "./generateMockPlayerData";

let playerUpdateInterval: ReturnType<typeof setTimeout> | null = null;

const MenuObject = {
  warnSelf: (reason: string) => {
    debugData<SetWarnOpenData>([
      {
        action: "setWarnOpen",
        data: {
          reason: reason,
          warnedBy: "Taso",
          isWarningNew: true,
        },
      },
    ]);
  },
  setPlayerModalTarget: (target: string) => {
    debugData<string>([
      {
        action: "openPlayerModal",
        data: target
      }
    ])
  },
  startPlayerUpdateLoop: (ms = 30000) => {
    if (playerUpdateInterval) {
      clearTimeout(playerUpdateInterval);
      playerUpdateInterval = null;
    }

    console.log("Started player update loop");

    playerUpdateInterval = setInterval(() => {
      const mockPlayers = mockPlayerData(200);

      debugData<PlayerData[]>(
        [
          {
            action: "setPlayerList",
            data: mockPlayers,
          },
        ],
        3000
      );
    }, ms);
  },
  clearPlayerUpdateLoop: () => {
    if (!playerUpdateInterval) return console.error("No interval to clear");

    clearTimeout(playerUpdateInterval);
    playerUpdateInterval = null;
  },
  warnPulse: () => {
    debugData([
      {
        action: "pulseWarning",
        data: {},
      },
    ]);
  },
  closeWarn: () => {
    debugData([
      {
        action: "closeWarning",
        data: {},
      },
    ]);
  },
  announceMsg: ({ message, author }: AddAnnounceData) => {
    debugData([
      {
        action: "addAnnounceMessage",
        data: {
          message,
          author,
        },
      },
    ]);
  },
  setCustomLocale: (localeObj: LocaleType) => {
    debugData<ServerCtx>([
      {
        action: "setServerCtx",
        data: {
          announceNotiPos: "top-right",
          projectName: "",
          locale: "custom",
          localeData: localeObj,
          alignRight: false,
          maxClients: 32,
          oneSync: {
            status: true,
            type: "Infinity",
          },
          switchPageKey: "Tab",
          txAdminVersion: "9.9.9",
        },
      },
    ]);
  },
  setVisible: (bool: boolean = true) => {
    debugData(
      [
        {
          action: "setVisible",
          data: bool,
        },
      ],
      0
    );
  },
  useMockPlayerList: () => {
    debugData([
      {
        action: "setPlayerList",
        data: mockPlayerData(400),
      },
    ]);
  },
};

export const registerDebugFunctions = () => {
  if (isBrowserEnv()) {
    (window as any).menuDebug = MenuObject;

    console.log(
      "%ctxAdmin Menu Development",
      "font-weight: bold; font-size: 25px; color: red;"
    );
    console.log(
      "%cDebug Utilities have been injected for browser use. Inspect `window.menuDebug` object for further details.",
      "font-size: 15px; color: green;"
    );
  }
};
