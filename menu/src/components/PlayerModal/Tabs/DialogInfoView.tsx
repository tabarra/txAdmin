import React from "react";
import { DialogContent, TextField, Typography, useTheme } from "@material-ui/core";

const DialogInfoView: React.FC = () => {
  const theme = useTheme();
  return (
    <DialogContent>
      <Typography variant="h6">Player Info</Typography>
      <Typography>Session Time: <span style={{ color: theme.palette.text.secondary }}>0 minutes</span></Typography>
      <Typography>Play time: <span style={{ color: theme.palette.text.secondary }}>--</span></Typography>
      <Typography>Joined: <span
        style={{ color: theme.palette.text.secondary }}>May 4, 2021 - 14:25:15</span></Typography>
      <TextField
        autoFocus
        margin="dense"
        id="name"
        label="Notes about this player"
        type="text"
        placeholder="Someting about Tabarra"
        variant="outlined"
        multiline
        rows={4}
        rowsMax={4}
        fullWidth
      />
    </DialogContent>
  )
}

export default DialogInfoView;