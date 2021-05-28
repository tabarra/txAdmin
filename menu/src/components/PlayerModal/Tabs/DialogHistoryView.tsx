import React, { useState, useCallback } from 'react';
import { Box, DialogContent, Typography, useTheme } from "@material-ui/core";
import { useStyles } from "../modal.styles";
import { PlayerModalProps, usePlayerDetails } from "../../../state/players.state";
import humanizeDuration from 'humanize-duration';
import { useTranslate } from 'react-polyglot';

const now = () => { return Math.round(Date.now() / 1000); };

const actionTypes = {
  WARN: {
    title: 'WARNED',
    color: '#f1c40f'
  },
  'WARN-REVOKED': {
    title: 'REVOKED the WARN for',
    color: 'gray'
  },
  KICK: {
    title: 'KICKED',
    color: '#e67e22'
  },
  BAN: {
    title: 'BANNED',
    color: '#c2293e'
  },
  'BAN-REVOKED': {
    title: 'REVOKED the BAN for',
    color: 'gray'
  },
  WHITELIST: {
    title: 'WHITELISTED',
    color: '#c2293e'
  },
  'WHITELIST-REVOKED': {
    title: 'REVOKED the WHITELIST for',
    color: 'gray'
  }
}

const DialogHistoryView: React.FC = () => {
  const classes = useStyles();
  const player = usePlayerDetails();
  const theme = useTheme();
  const t = useTranslate();

  let humanizeOptions = {
    language: t('$meta.humanizer_language'),
    round: true,
    units: ['d', 'h', 'm', 's'],
    fallbacks: ['en'],
  };

  const ts = now();

  const [history, setHistory] = useState<PlayerModalProps>(
    {
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
          "action": "BAN-REVOKED",
          "date": "30/05",
          "reason": "sdfsdfsdf",
          "author": "tabarra",
          "color": "dark"
        },
        {
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
  )

  return (
    <DialogContent>
      <Typography variant="h6" style={{ paddingBottom: 5 }}>Related History</Typography>
      <Box>
        {history.actionHistory.map((h) => (
          <Box className={classes.historyItem} borderLeft={`solid 2px ${actionTypes[h.action]['color']}`}>
            <Box>
              <Typography>{h.author} {actionTypes[h.action]['title']} {player.username}</Typography>
              <Typography style={{ color: theme.palette.text.secondary }}>{h.reason}</Typography>

              {h.action === 'BAN-REVOKED' || h.action === 'WHITELIST-REVOKED' && <Typography style={{ color: theme.palette.text.secondary }}>Revoked at {humanizeDuration(new Date(h.date).toLocaleString())}</Typography>}

              {h.action === 'BAN' && <Typography style={{ color: theme.palette.text.secondary }}>Expires in {humanizeDuration(h.date, humanizeOptions)}</Typography>}
            </Box>
            <Box>
             <Typography>{h.date}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </DialogContent>
  )
}

export default DialogHistoryView;