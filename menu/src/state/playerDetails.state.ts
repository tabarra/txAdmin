import { atom, useRecoilValue, useSetRecoilState } from 'recoil';

interface PlayerHistoryItem {
  id: string;
  action: string;
  date: string;
  reason: string;
  author: string;
  color?: string;
}

enum HistoryActionType {
  Warn = 'WARN',
  WarnRevoked = 'WARN-REVOKED',
  Kick = 'KICK',
  Ban = 'BAN',
  BanRevoked = 'BAN-REVOKED',
  Whitelist = 'WHITELIST',
  WhitelistRevoked = 'WHITELIST-REVOKED'
}

interface TxAdminAPIResp {
  funcDisabled: {
    message: string;
    kick: string;
    warn: string;
    ban: boolean;
  }
  id: boolean;
  license: string;
  identifiers: string[];
  isTmp: boolean;
  name: string;
  actionHistory: PlayerHistoryItem[]
  joinDate: string;
  sessionTime: string;
  playTime: string;
  notesLog: string;
  notes: string;
}

const MockDataState = {
  "funcDisabled": {
    "message": "disabled",
    "kick": "disabled",
    "warn": "disabled",
    "ban": false
  },
  "id": false,
  "license": "9b9fc300cc65d22ad3b536175a4d15c0e4933753",
  "identifiers": [
    "license:9b9fc300cc65d22ad3b536175a4d15c0e4933753"
  ],
  "isTmp": false,
  "name": "Soneca",
  "actionHistory": [
    {
      "id": "ADX9-C61Y",
      "action": "BAN-REVOKED",
      "date": "30/05",
      "reason": "sdfsdfsdf",
      "author": "tabarra",
      "color": "dark"
    },
    {
      "id": "BPGZ-HL53",
      "action": "WHITELIST-REVOKED",
      "date": "30/05",
      "reason": null,
      "author": "tabarra",
      "color": "dark"
    },
    {
      "action": "BAN-REVOKED",
      "date": "30/05",
      "reason": "efrdgdfdf",
      "author": "tabarra",
      "color": "dark"
    },
    {
      "action": "WARN",
      "date": "31/05",
      "reason": "warningggggggggggg",
      "author": "tabarra",
      "color": "warning"
    },
    {
      "action": "BAN-REVOKED",
      "date": "31/05",
      "reason": "ban test",
      "author": "tabarra",
      "color": "dark"
    },
    {
      "action": "BAN-REVOKED",
      "date": "31/05",
      "reason": "aaaaaaaaaaaaaaaaaa",
      "author": "tabarra",
      "color": "dark"
    },
    {
      "action": "WHITELIST-REVOKED",
      "date": "14/06",
      "reason": null,
      "author": "tabarra",
      "color": "dark"
    },
    {
      "action": "WARN",
      "date": "14/06",
      "reason": "🆃🆇🅰🅳🅼🅸🅽",
      "author": "tabarra",
      "color": "warning"
    },
    {
      "action": "WHITELIST-REVOKED",
      "date": "30/06",
      "reason": null,
      "author": "tabarra",
      "color": "dark"
    },
    {
      "action": "WHITELIST-REVOKED",
      "date": "30/06",
      "reason": null,
      "author": "tabarra",
      "color": "dark"
    },
    {
      "action": "WHITELIST-REVOKED",
      "date": "30/06",
      "reason": null,
      "author": "tabarra",
      "color": "dark"
    },
    {
      "action": "WARN",
      "date": "30/06",
      "reason": "zxc",
      "author": "tabarra",
      "color": "warning"
    },
    {
      "action": "BAN-REVOKED",
      "date": "30/06",
      "reason": "dsfdfs",
      "author": "tabarra",
      "color": "dark"
    },
    {
      "action": "BAN-REVOKED",
      "date": "30/06",
      "reason": "sadf sadf asdf asd",
      "author": "tabarra",
      "color": "dark"
    },
    {
      "action": "BAN-REVOKED",
      "date": "30/06",
      "reason": "msgmsgmsgmsg msg",
      "author": "tabarra",
      "color": "dark"
    },
    {
      "action": "BAN-REVOKED",
      "date": "30/06",
      "reason": "sdf sdf dsf ds",
      "author": "tabarra",
      "color": "dark"
    },
    {
      "action": "WHITELIST",
      "date": "30/06",
      "reason": null,
      "author": "tabarra",
      "color": "success"
    },
    {
      "action": "BAN-REVOKED",
      "date": "30/06",
      "reason": "asdasd",
      "author": "tabarra",
      "color": "dark"
    },
    {
      "action": "BAN-REVOKED",
      "date": "30/06",
      "reason": "sadf",
      "author": "tabarra",
      "color": "dark"
    },
    {
      "action": "BAN-REVOKED",
      "date": "30/06",
      "reason": "zdfgdfg dfg dfg dfdfg",
      "author": "tabarra",
      "color": "dark"
    },
    {
      "action": "WARN",
      "date": "07/07",
      "reason": "dfsg",
      "author": "tabarra",
      "color": "warning"
    },
    {
      "action": "WARN",
      "date": "07/07",
      "reason": "fds",
      "author": "tabarra",
      "color": "warning"
    },
    {
      "action": "WARN-REVOKED",
      "date": "07/07",
      "reason": "sdf",
      "author": "tabarra",
      "color": "dark"
    },
    {
      "action": "WARN",
      "date": "07/07",
      "reason": "yuiyiu",
      "author": "tabarra",
      "color": "warning"
    },
    {
      "action": "BAN",
      "date": "25/05",
      "reason": "ssss",
      "author": "tabarra",
      "color": "danger"
    }
  ],
  "joinDate": "May 30, 2020 - 01:27:49",
  "sessionTime": "0 minutes",
  "playTime": "1 hour, 57 minutes",
  "notesLog": "",
  "notes": ""
}

const playerDetails = {
  data: atom<TxAdminAPIResp | null>({
    key: 'selectedPlayerDetails',
    default: MockDataState
  }),
  loading: atom({
    key: 'selectedPlayerDetailsLoading',
    default: true
  })
}

export const usePlayerDetailsValue = () => useRecoilValue(playerDetails.data)

export const useSetPlayerDetails = () => useSetRecoilState(playerDetails.data)

export const usePlayerDetailsLoading = () => useRecoilValue(playerDetails.loading)

export const useSetPlayerDetailsLoading = () => useSetRecoilState(playerDetails.loading)