import React, { FormEventHandler, useEffect, useState } from 'react';
import {
  Box,
  Button,
  DialogContent,
  TextField,
  Typography,
  useTheme,
} from "@material-ui/core";
import { useForcePlayerRefresh, usePlayerDetailsValue } from '../../../state/playerDetails.state';
import { fetchWebPipe } from "../../../utils/fetchWebPipe";
import { useSnackbar } from "notistack";
import { useTranslate } from "react-polyglot";

const DialogInfoView: React.FC = () => {
  const [note, setNote] = useState("");
  const player = usePlayerDetailsValue();
  const { enqueueSnackbar } = useSnackbar();
  const playerDetails = usePlayerDetailsValue()
  const forceRefresh = useForcePlayerRefresh()

  const t = useTranslate();

  const theme = useTheme();

  const handleSaveNote: FormEventHandler = async (e) => {
    e.preventDefault();
    try {
      const resp = await fetchWebPipe('/player/save_note', {
        method: 'POST',
        data: {
          license: playerDetails.license,
          note: note,
        }
      })
      enqueueSnackbar("Saved Note", {
        variant: "success",
      });
      forceRefresh(val => val + 1)
    } catch (e) {
      console.error(e)
      enqueueSnackbar("An error ocurred saving the note", {
        variant: "error",
      });
    }
  };

  useEffect(() => {
    setNote(playerDetails.notes || "")
  }, [playerDetails])

  return (
    <DialogContent>
      <Typography variant="h6">{t("nui_menu.player_modal.info.title")}</Typography>
      <Typography>
        {t("nui_menu.player_modal.info.session_time")}:{" "}
        <span style={{ color: theme.palette.text.secondary }}>0 minutes</span>
      </Typography>
      <Typography>
      {t("nui_menu.player_modal.info.play_time")}:{" "}
        <span style={{ color: theme.palette.text.secondary }}>--</span>
      </Typography>
      <Typography>
      {t("nui_menu.player_modal.info.joined")}:{" "}
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
