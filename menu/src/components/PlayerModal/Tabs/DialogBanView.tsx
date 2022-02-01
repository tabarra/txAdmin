import React, { useState } from "react";
import {
  Box,
  Button,
  DialogContent,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { usePlayerDetailsValue } from "../../../state/playerDetails.state";
import { fetchWebPipe } from "../../../utils/fetchWebPipe";
import { useSnackbar } from "notistack";
import { useTranslate } from "react-polyglot";
import { usePlayerModalContext } from "../../../provider/PlayerModalProvider";
import { translateAlertType, userHasPerm } from "../../../utils/miscUtils";
import { usePermissionsValue } from "../../../state/permissions.state";
import xss from "xss";
import { TxAdminAPIResp } from "./DialogActionView";
import { DialogLoadError } from "./DialogLoadError";

const DialogBanView: React.FC = () => {
  const assocPlayer = usePlayerDetailsValue();

  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("2 hours");
  const [customDuration, setCustomDuration] = useState("hours");
  const [customDurLength, setCustomDurLength] = useState("1");
  const t = useTranslate();
  const { enqueueSnackbar } = useSnackbar();
  const { showNoPerms } = usePlayerModalContext();
  const playerPerms = usePermissionsValue();

  if (typeof assocPlayer !== "object") {
    return <DialogLoadError />;
  }

  const handleBan = async (e) => {
    e.preventDefault();

    if (!userHasPerm("players.ban", playerPerms)) return showNoPerms("Ban");

    const actualDuration =
      duration === "custom" ? `${customDurLength} ${customDuration}` : duration;
    // Should do something with the res eventually
    try {
      const resp = await fetchWebPipe<TxAdminAPIResp>("/player/ban", {
        method: "POST",
        data: {
          reason,
          duration: actualDuration,
          reference: assocPlayer.identifiers,
        },
      });
      // We need to clean the response as it contains html
      const cleanedMsg = xss(resp.message);

      enqueueSnackbar(cleanedMsg, { variant: translateAlertType(resp.type) });
    } catch (e) {
      enqueueSnackbar(t("nui_menu.misc.unknown_error"), { variant: "error" });
      console.error(e);
    }
  };

  const banDurations = [
    {
      value: "2 hours",
      label: `2 ${t("nui_menu.player_modal.ban.hours")}`,
    },
    {
      value: "8 hours",
      label: `8 ${t("nui_menu.player_modal.ban.hours")}`,
    },
    {
      value: "1 day",
      label: `1 ${t("nui_menu.player_modal.ban.days")}`,
    },
    {
      value: "2 days",
      label: `2 ${t("nui_menu.player_modal.ban.days")}`,
    },
    {
      value: "1 week",
      label: `1 ${t("nui_menu.player_modal.ban.weeks")}`,
    },
    {
      value: "2 weeks",
      label: `2 ${t("nui_menu.player_modal.ban.weeks")}`,
    },
    {
      value: "permanent",
      label: t("nui_menu.player_modal.ban.permanent"),
    },
    {
      value: "custom",
      label: t("nui_menu.player_modal.ban.custom"),
    },
  ];

  const customBanLength = [
    {
      value: "hours",
      label: t("nui_menu.player_modal.ban.hours"),
    },
    {
      value: "days",
      label: t("nui_menu.player_modal.ban.days"),
    },
    {
      value: "weeks",
      label: t("nui_menu.player_modal.ban.weeks"),
    },
    {
      value: "months",
      label: t("nui_menu.player_modal.ban.months"),
    },
  ];

  return (
    <DialogContent>
      <Typography variant="h6" sx={{mb: 2}}>{t("nui_menu.player_modal.ban.title")}</Typography>
      <form onSubmit={handleBan}>
        <TextField
          autoFocus
          size="small"
          id="name"
          label={t("nui_menu.player_modal.ban.reason_placeholder")}
          required
          type="text"
          variant="outlined"
          fullWidth
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
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
          helperText={t("nui_menu.player_modal.ban.helper_text")}
          fullWidth
        >
          {banDurations.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        {duration === "custom" && (
          <Box display="flex" alignItems="center" justifyContent="center">
            <Box>
              <TextField
                type="number"
                placeholder="1"
                variant="outlined"
                size="small"
                value={customDurLength}
                onChange={(e) => setCustomDurLength(e.target.value)}
              />
            </Box>
            <Box flexGrow={1}>
              <TextField
                select
                size="small"
                variant="outlined"
                fullWidth
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
              >
                {customBanLength.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>
        )}
        <Button
          variant="contained"
          type="submit"
          color="primary"
          sx={{ mt: 2 }}
          onClick={handleBan}
        >
          {t("nui_menu.player_modal.ban.submit")}
        </Button>
      </form>
    </DialogContent>
  );
};

export default DialogBanView;
