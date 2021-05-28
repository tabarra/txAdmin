import React from "react";
import { Box, DialogContent, Typography, useTheme } from "@material-ui/core";
import { useStyles } from "../modal.styles";
import { PlayerData, usePlayerDetails } from "../../../state/players.state";

const DialogIdView: React.FC = () => {
  const theme = useTheme();
  const classes = useStyles();
  const player = usePlayerDetails();

  console.log('ids', player)

  return (
    <DialogContent>
      <Typography variant="h6" style={{ paddingBottom: 5 }}>Player Identifiers</Typography>
      {player.identifiers.map(id => (
        <Box className={classes.codeBlock}>
          <Typography className={classes.codeBlockText}>{id}</Typography>
        </Box>
      ))}
    </DialogContent>
  )
}

export default DialogIdView;