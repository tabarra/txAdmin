import { isBrowserEnv } from "./miscUtils";
import { debugData } from "./debugData";
import { VehicleStatus } from "../hooks/usePlayerListListener";
import { CustomLocaleData, ServerCtx } from "../state/server.state";
import { SetWarnOpenData } from "../components/WarnPage/WarnPage";
import { AddAnnounceData } from "../hooks/useHudListenersService";

const MenuObject = {
  warnSelf: (reason: string) => {
    debugData<SetWarnOpenData>([
      {
        action: "setWarnOpen",
        data: {
          reason: reason,
          warnedBy: "Taso",
        },
      },
    ]);
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
  setCustomLocale: (localeObj: CustomLocaleData) => {
    debugData<ServerCtx>([
      {
        action: "setServerCtx",
        data: {
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
        data: [
          {
            vType: VehicleStatus.Walking,
            name: "Chip",
            id: 1,
            dist: 0,
            health: 80,
            admin: false,
          },
          {
            vType: VehicleStatus.Driving,
            name: "Taso",
            id: 2,
            dist: 100,
            health: 50,
            admin: true,
          },
          {
            vType: VehicleStatus.Boat,
            name: "Tabarra",
            id: 3,
            dist: 60,
            health: 10,
            admin: true,
          },
          {
            vType: VehicleStatus.Boat,
            name: "Death",
            id: 4,
            dist: 30,
            health: 100,
            admin: false,
          },
          {
            vType: VehicleStatus.Unknown,
            name: "Death",
            id: 5,
            dist: 500,
            health: 70,
            admin: false,
          },
          {
            vType: VehicleStatus.Walking,
            name: "Death",
            id: 6,
            dist: 500,
            health: 100,
            admin: false,
          },
          {
            vType: VehicleStatus.Biking,
            name: "Death",
            id: 7,
            dist: -1,
            health: 40,
            admin: false,
          },
          {
            vType: VehicleStatus.Boat,
            name: "Death",
            id: 8,
            dist: 2000,
            health: 40,
            admin: false,
          },
          {
            vType: VehicleStatus.Boat,
            name: "Death",
            id: 9,
            dist: 500,
            health: 40,
            admin: false,
          },
          {
            vType: VehicleStatus.Boat,
            name: "Death",
            id: 10,
            dist: 500,
            health: 40,
            admin: false,
          },
          {
            vType: VehicleStatus.Boat,
            name: "Death",
            id: 11,
            dist: -1,
            health: 40,
            admin: false,
          },
          {
            vType: VehicleStatus.Boat,
            name: "Death",
            id: 12,
            dist: 500,
            health: 40,
            admin: false,
          },
          {
            vType: VehicleStatus.Boat,
            name: "Death",
            id: 13,
            dist: 500,
            health: 40,
            admin: false,
          },
          {
            vType: VehicleStatus.Boat,
            name: "Death",
            id: 14,
            dist: 11,
            health: 40,
            admin: false,
          },
          {
            vType: VehicleStatus.Boat,
            name: "Death",
            id: 15,
            dist: 500,
            health: 40,
            admin: false,
          },
          {
            vType: VehicleStatus.Boat,
            name: "Death",
            id: 16,
            dist: 500,
            health: 40,
            admin: false,
          },
        ],
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
