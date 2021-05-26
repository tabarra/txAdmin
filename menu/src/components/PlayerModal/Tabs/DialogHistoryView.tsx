import React, { useState, useCallback } from 'react';
import { Box, DialogContent, Typography, useTheme } from "@material-ui/core";
import { useStyles } from "../modal.styles";
import { usePlayerDetails } from "../../../state/players.state";

interface HistoryProps {
  date: string;
  type: 'warn' | 'kick' | 'ban',
  reason: string;
  createdBy: string;
}

const actionTypes = {
  warn: {
    title: 'warned',
    color: '#f1c40f'
  },
  kick: {
    title: 'kicked',
    color: '#e67e22'
  },
  ban: {
    title: 'banned',
    color: '#c2293e'
  }
}

const DialogHistoryView: React.FC = () => {
  const classes = useStyles();
  const player = usePlayerDetails();
  const theme = useTheme();

  const [history, setHistory] = useState<HistoryProps[]>([
    {
      date: '5/25 | 7.20pm',
      type: 'warn',
      reason: 'Trolling and causing mayhem',
      createdBy: 'chip'
    },
    {
      date: '4/25 | 7.20pm',
      type: 'kick',
      reason: 'RDM',
      createdBy: 'rp admin'
    },
    {
      date: '2/25 | 7.20pm',
      type: 'ban',
      reason: 'Trolling and causing mayhem',
      createdBy: 'chip'
    },
    {
      date: '9/25 | 7.20pm',
      type: 'warn',
      reason: 'Trolling and causing mayhem',
      createdBy: 'chip'
    },
  ])

  return (
    <DialogContent>
      <Typography variant="h6" style={{ paddingBottom: 5 }}>Related History</Typography>
      <Box>
        {history.map((h) => (
          <Box className={classes.historyItem} borderLeft={`solid 2px ${actionTypes[h.type]['color']}`}>
            <Box>
              <Typography>{h.createdBy} {actionTypes[h.type]['title']} {player.username}</Typography>
              <Typography style={{ color: theme.palette.text.secondary }}>{h.reason}</Typography>
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