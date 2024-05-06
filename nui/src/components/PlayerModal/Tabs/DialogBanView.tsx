import React, { useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  DialogContent,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import {
  useAssociatedPlayerValue,
  usePlayerDetailsValue,
} from "../../../state/playerDetails.state";
import { fetchWebPipe } from "../../../utils/fetchWebPipe";
import { useSnackbar } from "notistack";
import { useTranslate } from "react-polyglot";
import { usePlayerModalContext } from "../../../provider/PlayerModalProvider";
import { userHasPerm } from "../../../utils/miscUtils";
import { usePermissionsValue } from "../../../state/permissions.state";
import { DialogLoadError } from "./DialogLoadError";
import { GenericApiErrorResp, GenericApiResp } from "@shared/genericApiTypes";
import { useSetPlayerModalVisibility } from "@nui/src/state/playerModal.state";
import type { BanTemplatesDataType, BanDurationType } from "@shared/otherTypes";

//Helpers - yoinked from the web ui code
const maxReasonSize = 128;
const defaultDurations = ['permanent', '2 hours', '8 hours', '1 day', '2 days', '1 week', '2 weeks'];
const banDurationToString = (duration: BanDurationType) => {
  if (duration === 'permanent') return 'permanent';
  if (typeof duration === 'string') return duration;
  const pluralizedString = duration.value === 1 ? duration.unit.slice(0, -1) : duration.unit;
  return `${duration.value} ${pluralizedString}`;
}
const banDurationToShortString = (duration: BanDurationType) => {
  if (typeof duration === 'string') {
    return duration === 'permanent' ? 'PERM' : duration;
  }

  let suffix: string;
  if (duration.unit === 'hours') {
    suffix = 'h';
  } else if (duration.unit === 'days') {
    suffix = 'd';
  } else if (duration.unit === 'weeks') {
    suffix = 'w';
  } else if (duration.unit === 'months') {
    suffix = 'mo';
  } else {
    suffix = duration.unit;
  }
  return `${duration.value}${suffix}`;
}

const DialogBanView: React.FC = () => {
  const assocPlayer = useAssociatedPlayerValue();
  const playerDetails = usePlayerDetailsValue();
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("2 hours");
  const [customDuration, setCustomDuration] = useState("hours");
  const [customDurLength, setCustomDurLength] = useState("1");
  const t = useTranslate();
  const setModalOpen = useSetPlayerModalVisibility();
  const { enqueueSnackbar } = useSnackbar();
  const { showNoPerms } = usePlayerModalContext();
  const playerPerms = usePermissionsValue();

  if (typeof assocPlayer !== "object") {
    return <DialogLoadError />;
  }

  const handleBan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userHasPerm("players.ban", playerPerms)) return showNoPerms("Ban");

    const trimmedReason = reason.trim();
    if (!trimmedReason.length) {
      enqueueSnackbar(t("nui_menu.player_modal.ban.reason_required"), {
        variant: "error",
      });
      return;
    }

    const actualDuration = duration === "custom"
      ? `${customDurLength} ${customDuration}`
      : duration;

    fetchWebPipe<GenericApiResp>(
      `/player/ban?mutex=current&netid=${assocPlayer.id}`,
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
          enqueueSnackbar(t(`nui_menu.player_modal.ban.success`), {
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

  //Handling ban templates
  const banTemplates: BanTemplatesDataType[] = (playerDetails as any)?.banTemplates ?? [];
  const processedTemplates = useMemo(() => {
    return banTemplates.map((template, index) => ({
      id: template.id,
      label: template.reason,
    }));
  }, [banTemplates]);

  const handleTemplateChange = (event: React.SyntheticEvent, value: any, reason: string, details?: any) => {
    //reason = One of "createOption", "selectOption", "removeOption", "blur" or "clear".
    if (reason !== 'selectOption' || value === null) return;
    const template = banTemplates.find(template => template.id === value.id);
    if (!template) return;

    const processedDuration = banDurationToString(template.duration);
    if (defaultDurations.includes(processedDuration)) {
      setDuration(processedDuration);
    } else if (typeof template.duration === 'object') {
      setDuration('custom');
      setCustomDurLength(template.duration.value.toString());
      setCustomDuration(template.duration.unit);
    }
  }

  const handleReasonInputChange = (event: React.SyntheticEvent, value: string, reason: string) => {
    setReason(value);
  }

  return (
    <DialogContent>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t("nui_menu.player_modal.ban.title")}
      </Typography>
      <form onSubmit={handleBan}>
        <Autocomplete
          id="name"
          autoFocus
          size="small"
          freeSolo
          value={reason}
          onChange={handleTemplateChange}
          onInputChange={handleReasonInputChange}
          options={processedTemplates}
          renderOption={(props, option, state) => {
            const duration = banTemplates.find((t) => t.id === option.id)?.duration ?? '????';
            const reason = option.label.length > maxReasonSize
              ? option.label.slice(0, maxReasonSize - 3) + '...'
              : option.label;
            return <li {...props} key={option.id}>
              <span
                style={{
                  display: "inline-block",
                  paddingRight: "0.5rem",
                  fontFamily: "monospace",
                  opacity: "0.75",
                  minWidth: "4ch"
                }}
              >{banDurationToShortString(duration as any)}</span> {reason}
            </li>
          }}
          renderInput={(params) => <TextField {...params} label="Reason" />}
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
              {customBanLength.map((option) => (
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
          color="error"
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
