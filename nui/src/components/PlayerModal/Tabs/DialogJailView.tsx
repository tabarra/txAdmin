import React, { useState } from "react";
import {
  Box,
  Button,
  DialogContent,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useAssociatedPlayerValue } from "../../../state/playerDetails.state";
import { fetchWebPipe } from "../../../utils/fetchWebPipe";
import { useSnackbar } from "notistack";
import { useTranslate } from "react-polyglot";
import { usePlayerModalContext } from "../../../provider/PlayerModalProvider";
import { userHasPerm } from "../../../utils/miscUtils";
import { usePermissionsValue } from "../../../state/permissions.state";
import { DialogLoadError } from "./DialogLoadError";
import { GenericApiErrorResp, GenericApiResp } from "@shared/genericApiTypes";
import { useSetPlayerModalVisibility } from "@nui/src/state/playerModal.state";

const DialogJailView: React.FC = () => {
  const assocPlayer = useAssociatedPlayerValue();
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("30 minutes");
  const [customDuration, setCustomDuration] = useState("minutes");
  const [customDurLength, setCustomDurLength] = useState("1");
  const t = useTranslate();
  const setModalOpen = useSetPlayerModalVisibility();
  const { enqueueSnackbar } = useSnackbar();
  const { showNoPerms } = usePlayerModalContext();
  const playerPerms = usePermissionsValue();

  if (typeof assocPlayer !== "object") {
    return <DialogLoadError />;
  }

  const handleJail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userHasPerm("players.jail", playerPerms)) return showNoPerms("Jail");

    const trimmedReason = reason.trim();
    if (!trimmedReason.length) {
      enqueueSnackbar(t("nui_menu.player_modal.jail.reason_required"), {
        variant: "error",
      });
      return;
    }

    const actualDuration = duration === "custom"
      ? `${customDurLength} ${customDuration}`
      : duration;

    fetchWebPipe<GenericApiResp>(
      `/player/jail?mutex=current&netid=${assocPlayer.id}`,
      {
        method: "POST",
        data: {
          reason: trimmedReason,
          duration: actualDuration,
        },
      }
    )
      .then((result) => {
        if ("success" in result && result.success) {
          setModalOpen(false);
          enqueueSnackbar(t(`nui_menu.player_modal.jail.success`), {
            variant: "success",
          });
        } else {
          enqueueSnackbar(
            (result as GenericApiErrorResp).error ?? t("nui_menu.misc.unknown_error"),
            { variant: "error" }
          );
        }
      })
      .catch((error) => {
        enqueueSnackbar((error as Error).message, { variant: "error" });
      });
  };

  const jailDurations = [
    {
      value: "15 minutes",
      label: `15 ${t("nui_menu.player_modal.jail.minutes")}`,
    },
    {
      value: "30 minutes",
      label: `30 ${t("nui_menu.player_modal.jail.minutes")}`,
    },
    {
      value: "1 hours",
      label: `1 ${t("nui_menu.player_modal.ban.hours")}`,
    },
    {
      value: "2 hours",
      label: `2 ${t("nui_menu.player_modal.ban.hours")}`,
    },
    {
      value: "custom",
      label: t("nui_menu.player_modal.ban.custom"),
    },
  ];

  const customJailLength = [
    {
      value: "minutes",
      label: t("nui_menu.player_modal.jail.minutes"),
    },
    {
      value: "hours",
      label: t("nui_menu.player_modal.ban.hours"),
    },
    {
      value: "days",
      label: t("nui_menu.player_modal.ban.days"),
    },
  ];

  return (
    <DialogContent>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t("nui_menu.player_modal.jail.title")}
      </Typography>
      <form onSubmit={handleJail}>
        <TextField
          id="jail-reason"
          autoFocus
          size="small"
          fullWidth
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <TextField
          size="small"
          select
          required
          sx={{ mt: 2 }}
          label={t("nui_menu.player_modal.ban.duration_placeholder")}
          variant="outlined"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          helperText={t("nui_menu.player_modal.jail.helper_text")}
          fullWidth
        >
          {jailDurations.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        {duration === "custom" && (
          <Box display="flex" alignItems="stretch" gap={1}>
            <TextField
              type="number"
              placeholder="1"
              variant="outlined"
              size="small"
              value={customDurLength}
              onChange={(e) => setCustomDurLength(e.target.value)}
            />
            <TextField
              select
              variant="outlined"
              size="small"
              fullWidth
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
            >
              {customJailLength.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        )}
        <Button
          variant="contained"
          type="submit"
          color="warning"
          sx={{ mt: 2 }}
          onClick={handleJail}
        >
          {t("nui_menu.player_modal.jail.submit")}
        </Button>
      </form>
    </DialogContent>
  );
};

export default DialogJailView;
