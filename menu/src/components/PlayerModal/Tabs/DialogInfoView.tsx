import React, { FormEventHandler, useState } from "react";
import {
  Box,
  Button,
  DialogContent,
  TextField,
  Typography,
  useTheme,
} from "@material-ui/core";
import { usePlayerDetailsValue } from "../../../state/playerDetails.state";
import { fetchWebPipe } from "../../../utils/fetchWebPipe";
import { useSnackbar } from "notistack";

const DialogInfoView: React.FC = () => {
  const [note, setNote] = useState("");
  const player = usePlayerDetailsValue();
  const { enqueueSnackbar } = useSnackbar();

  const theme = useTheme();

  const handleSaveNote = async (e) => {
    e.preventDefault();
    try {
      enqueueSnackbar("Saved Note", {
        variant: "success",
      });
    } catch (e) {
      enqueueSnackbar("An error ocurred saving the note", {
        variant: "error",
      });
    }
  };

  return (
    <DialogContent>
      <Typography variant="h6">Player Info</Typography>
      <Typography>
        Session Time:{" "}
        <span style={{ color: theme.palette.text.secondary }}>
          {player.sessionTime}
        </span>
      </Typography>
      <Typography>
        Play time:{" "}
        <span style={{ color: theme.palette.text.secondary }}>
          {player.playTime}
        </span>
      </Typography>
      <Typography>
        Joined:{" "}
        <span style={{ color: theme.palette.text.secondary }}>
          {player.joinDate}
        </span>
      </Typography>
      <form onSubmit={handleSaveNote}>
        <Box pt={1}>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Notes about this player"
            type="text"
            value={note}
            onChange={(e) => setNote(e.currentTarget.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSaveNote}
            variant="outlined"
            multiline
            rows={4}
            rowsMax={4}
            fullWidth
          />
          <Button
            type="submit"
            color="primary"
            variant="outlined"
            style={{ right: 0 }}
          >
            Save Note
          </Button>
        </Box>
      </form>
    </DialogContent>
  );
};

export default DialogInfoView;
