import React from "react";
import { Box, DialogContent, Typography, useTheme } from "@material-ui/core";
import { useStyles } from "../modal.styles";
import { usePlayerDetailsValue } from "../../../state/playerDetails.state";

const actionTypes = {
  WARN: {
    title: "WARNED",
    color: "#f1c40f",
  },
  "WARN-REVOKED": {
    title: "REVOKED the WARN for",
    color: "gray",
  },
  KICK: {
    title: "KICKED",
    color: "#e67e22",
  },
  BAN: {
    title: "BANNED",
    color: "#c2293e",
  },
  "BAN-REVOKED": {
    title: "REVOKED the BAN for",
    color: "gray",
  },
  WHITELIST: {
    title: "WHITELISTED",
    color: "#c2293e",
  },
  "WHITELIST-REVOKED": {
    title: "REVOKED the WHITELIST for",
    color: "gray",
  },
};

const DialogHistoryView: React.FC = () => {
  const classes = useStyles();
  const player = usePlayerDetailsValue();
  const theme = useTheme();

  return (
    <DialogContent>
      <Typography variant="h6" style={{ paddingBottom: 5 }}>
        Related History
      </Typography>
      <Box>
        {player.actionHistory.map((h, index) => (
          <Box
            className={classes.historyItem}
            borderLeft={`solid 2px ${actionTypes[h.action].color}`}
            key={index}
          >
            <Box>
              <Typography>
                {h.author} {actionTypes[h.action].title} {player.name}
              </Typography>
              <Typography style={{ color: theme.palette.text.secondary }}>
                {h.reason}
              </Typography>
            </Box>
            <Box>
              <Typography>{h.date}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </DialogContent>
  );
};

export default DialogHistoryView;
