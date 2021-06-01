import React, { useState } from "react";
import {
  Box,
  Button,
  DialogContent,
  MenuItem,
  TextField,
  Typography
} from '@material-ui/core';
import { usePlayerDetailsValue } from "../../../state/playerDetails.state";
import { fetchWebPipe } from "../../../utils/fetchWebPipe";
import { useSnackbar } from "notistack";
import { useTranslate } from "react-polyglot";
import { usePlayerModalContext } from '../../../provider/PlayerModalProvider';
import { userHasPerm } from '../../../utils/miscUtils';
import { usePermissionsValue } from '../../../state/permissions.state';

const DialogBanView: React.FC = () => {
  const player = usePlayerDetailsValue();

  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('2 hours');
  const [customDuration, setCustomDuration] = useState('hours')
  const [customDurLength, setCustomDurLength] = useState('1');
  const t = useTranslate();
  const { enqueueSnackbar } = useSnackbar();
  const { showNoPerms } = usePlayerModalContext();
  const playerPerms = usePermissionsValue()

  const handleBan = async (e) => {
    e.preventDefault();

    if (!userHasPerm("players.ban", playerPerms)) return showNoPerms("Ban");

    const actualDuration =
      duration === "custom" ? `${customDurLength} ${customDuration}` : duration;
    // Should do something with the res eventually
    try {
      const res = await fetchWebPipe("/player/ban", {
        method: "POST",
        data: {
          reason,
          actualDuration,
          reference: player.id,
        },
      });
      enqueueSnackbar("Player was banned!", { variant: "success" });
    } catch (e) {
      enqueueSnackbar("Ban failed: ", { variant: "error" });
    }
  };

  const banDurations = [
    {
      value: '2 hours',
      label: `2 ${t('nui_menu.player_modal.ban.hours')}`
    },
    {
      value: '8 hours',
      label: `8 ${t('nui_menu.player_modal.ban.hours')}`
    },
    {
      value: '1 day',
      label: `1 ${t('nui_menu.player_modal.ban.days')}`
    },
    {
      value: '2 days',
      label: `2 ${t('nui_menu.player_modal.ban.days')}`
    },
    {
      value: '1 week',
      label: `1 ${t('nui_menu.player_modal.ban.weeks')}`
    },
    {
      value: '2 weeks',
      label: `2 ${t('nui_menu.player_modal.ban.weeks')}`
    },
    {
      value: 'perma',
      label: t('nui_menu.player_modal.ban.perm')
    },
    {
      value: 'custom',
      label: t('nui_menu.player_modal.ban.custom')
    }
  ]
  
  const customBanLength = [
    {
      value: 'hours',
      label: 'Hours'
    },
    {
      value: 'days',
      label: 'Days'
    },
    {
      value: 'weeks',
      label: 'Week'
    },
    {
      value: 'months',
      label: 'Months'
    }
  ]

  return (
    <DialogContent>
      <Typography variant="h6">Ban Player</Typography>
      <form onSubmit={handleBan}>
        <TextField
          autoFocus
          margin="dense"
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
          autoFocus
          margin="dense"
          select
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
                margin="dense"
                value={customDurLength}
                onChange={(e) => setCustomDurLength(e.target.value)}
              />
            </Box>
            <Box flexGrow={1}>
              <TextField
                select
                variant="outlined"
                margin="dense"
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
          style={{ marginTop: 2 }}
          onClick={handleBan}
        >
          Ban
        </Button>
      </form>
    </DialogContent>
  );
};


export default DialogBanView;
