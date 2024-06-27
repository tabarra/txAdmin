import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import {
  useForcePlayerRefresh,
  usePlayerDetailsValue,
} from "../../../state/playerDetails.state";
import { useTranslate } from "react-polyglot";
import { DialogLoadError } from "./DialogLoadError";
import { PlayerHistoryItem } from "@shared/playerApiTypes";
import { useSnackbar } from "notistack";
import { fetchWebPipe } from "@nui/src/utils/fetchWebPipe";
import { GenericApiErrorResp, GenericApiResp } from "@shared/genericApiTypes";
import { ButtonXS } from "../../misc/ButtonXS";
import { tsToLocaleDateTime, userHasPerm } from "@nui/src/utils/miscUtils";
import { usePermissionsValue } from "@nui/src/state/permissions.state";

// TODO: Make the styling on this nicer
const NoHistoryBox = () => (
  <Box>
    <Typography color="textSecondary">
      No history found for this player.
    </Typography>
  </Box>
);

const colors = {
  danger: "#c2293e",
  warning: "#f1c40f",
  dark: "gray",
};

type ActionCardProps = {
  action: PlayerHistoryItem;
  permsDisableWarn: boolean;
  permsDisableBan: boolean;
  serverTime: number;
  btnAction: Function;
};
const ActionCard: React.FC<ActionCardProps> = ({
  action,
  permsDisableWarn,
  permsDisableBan,
  serverTime,
  btnAction,
}) => {
  const theme = useTheme();
  const t = useTranslate();

  const revokeButonDisabled =
    action.revokedBy !== undefined ||
    (action.type == "warn" && permsDisableWarn) ||
    (action.type == "ban" && permsDisableBan);

  let footerNote, actionColor, actionMessage;
  if (action.type == "ban") {
    actionColor = colors.danger;
    actionMessage = t("nui_menu.player_modal.history.banned_by", {
      author: action.author,
    });
  } else if (action.type == "warn") {
    actionColor = colors.warning;
    actionMessage = t("nui_menu.player_modal.history.warned_by", {
      author: action.author,
    });
  }
  if (action.revokedBy) {
    actionColor = colors.dark;
    footerNote = t("nui_menu.player_modal.history.revoked_by", {
      author: action.revokedBy,
    });
  }
  if (typeof action.exp == "number") {
    const expirationDate = tsToLocaleDateTime(action.exp, "medium");
    footerNote =
      action.exp < serverTime
        ? t("nui_menu.player_modal.history.expired_at", {
          date: expirationDate,
        })
        : t("nui_menu.player_modal.history.expires_at", {
          date: expirationDate,
        });
  }

  return (
    <Box
      style={{
        background: theme.palette.background.paper,
        padding: "0.35rem 0.55rem",
        marginBottom: "6px",
        borderLeft: `solid 4px ${actionColor}`,
      }}
    >
      <Box
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <strong>{actionMessage}</strong>
        <Typography
          variant="caption"
          sx={{
            fontFamily: "monospace",
            fontWeight: "bold",
            color: theme.palette.text.secondary,
          }}
        >
          ({action.id}) &nbsp;
          {tsToLocaleDateTime(action.ts, "medium")}
          &nbsp;
          <ButtonXS
            color="secondary"
            variant="outlined"
            onClick={btnAction as any}
            disabled={revokeButonDisabled}
          >
            {t("nui_menu.player_modal.history.btn_revoke")}
          </ButtonXS>
        </Typography>
      </Box>
      <span style={{ color: theme.palette.text.secondary }}>
        {action.reason}
      </span>
      {footerNote && (
        <small style={{ display: "block", paddingTop: "0.35em" }}>
          {footerNote}
        </small>
      )}
    </Box>
  );
};

const DialogHistoryView: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const playerDetails = usePlayerDetailsValue();
  const forceRefresh = useForcePlayerRefresh();
  const userPerms = usePermissionsValue();
  const t = useTranslate();
  if ("error" in playerDetails) return <DialogLoadError />;

  //slice is required to clone the array
  const playerActionHistory = playerDetails.player.actionHistory
    .slice()
    .reverse();

  const handleRevoke = async (actionId: string) => {
    try {
      const result = await fetchWebPipe<GenericApiResp>(
        `/history/revokeAction`,
        {
          method: "POST",
          data: { actionId },
        }
      );
      if ("success" in result && result.success === true) {
        forceRefresh((val) => val + 1);
        enqueueSnackbar(t(`nui_menu.player_modal.history.revoked_success`), {
          variant: "success",
        });
      } else {
        enqueueSnackbar(
          (result as GenericApiErrorResp).error ?? t("nui_menu.misc.unknown_error"),
          { variant: "error" }
        );
      }
    } catch (error) {
      enqueueSnackbar((error as Error).message, { variant: "error" });
    }
  };

  const hasWarnPerm = userHasPerm('players.warn', userPerms);
  const hasBanPerm = userHasPerm('players.ban', userPerms);

  return (
    <Box p={2} height="100%" display="flex" flexDirection="column">
      <Typography variant="h6" style={{ paddingBottom: 5 }}>
        Related History:
      </Typography>
      <Box flexGrow={1} overflow="auto" pr={1}>
        {!playerActionHistory?.length ? (
          <NoHistoryBox />
        ) : (
          playerActionHistory.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              permsDisableWarn={!hasWarnPerm}
              permsDisableBan={!hasBanPerm}
              serverTime={playerDetails.serverTime}
              btnAction={() => {
                handleRevoke(action.id);
              }}
            />
          ))
        )}
      </Box>
    </Box>
  );
};

export default DialogHistoryView;
