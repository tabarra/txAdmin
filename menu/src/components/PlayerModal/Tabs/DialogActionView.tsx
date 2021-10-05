import React from "react";
import { Box, Button, DialogContent, Tooltip, TooltipProps, Typography } from "@mui/material";
import makeStyles from '@mui/styles/makeStyles';
import {
  useAssociatedPlayerValue,
  usePlayerDetailsValue,
} from "../../../state/playerDetails.state";
import { fetchWebPipe } from "../../../utils/fetchWebPipe";
import { fetchNui } from "../../../utils/fetchNui";
import { useDialogContext } from "../../../provider/DialogProvider";
import { useSnackbar } from "notistack";
import { useIFrameCtx } from "../../../provider/IFrameProvider";
import slug from "slug";
import { usePlayerModalContext } from "../../../provider/PlayerModalProvider";
import { translateAlertType, userHasPerm } from "../../../utils/miscUtils";
import { useTranslate } from "react-polyglot";
import { usePermissionsValue } from "../../../state/permissions.state";

export type TxAdminActionRespType = "success" | "warning" | "danger";

export interface TxAdminAPIResp {
  type: TxAdminActionRespType;
  message: string;
}

const useStyles = makeStyles({
  actionGrid: {
    display: "flex",
    columnGap: 10,
    rowGap: 10,
    paddingBottom: 15,
  },
  tooltipOverride: {
    fontSize: 12,
  },
  sectionTitle: {
    paddingBottom: 5,
  },
});

const DialogActionView: React.FC = () => {
  const classes = useStyles();
  const { openDialog } = useDialogContext();
  const playerDetails = usePlayerDetailsValue();
  const assocPlayer = useAssociatedPlayerValue();
  const { enqueueSnackbar } = useSnackbar();
  const t = useTranslate();
  const { goToFramePage } = useIFrameCtx();
  const playerPerms = usePermissionsValue();
  const { setModalOpen, closeMenu, showNoPerms } = usePlayerModalContext();

  const handleDM = () => {
    if (!userHasPerm("players.message", playerPerms))
      return showNoPerms("Message");

    openDialog({
      title: `${t(
        "nui_menu.player_modal.actions.moderation.dm_dialog.title"
      )} ${assocPlayer.username}`,
      description: t(
        "nui_menu.player_modal.actions.moderation.dm_dialog.description"
      ),
      placeholder: t(
        "nui_menu.player_modal.actions.moderation.dm_dialog.placeholder"
      ),
      onSubmit: (reason: string) => {
        fetchWebPipe<TxAdminAPIResp>("/player/message", {
          method: "POST",
          data: {
            id: assocPlayer.id,
            message: reason,
          },
        })
          .then((resp) => {
            enqueueSnackbar(
              t("nui_menu.player_modal.actions.moderation.dm_dialog.dm_sent"),
              { variant: translateAlertType(resp.type) }
            );
          })
          .catch((e) => {
            enqueueSnackbar(
              t("nui_menu.misc.unknown_error"),
              { variant: "error" }
            );
            console.error(e);
          });
      },
    });
  };

  const handleWarn = () => {
    if (!userHasPerm("players.warn", playerPerms)) return showNoPerms("Warn");

    openDialog({
      title: `${t(
        "nui_menu.player_modal.actions.moderation.warn_dialog.title"
      )} ${assocPlayer.username}`,
      description: t(
        "nui_menu.player_modal.actions.moderation.warn_dialog.description"
      ),
      placeholder: "Reason...",
      onSubmit: (reason: string) => {
        fetchWebPipe<TxAdminAPIResp>("/player/warn", {
          method: "POST",
          data: {
            id: assocPlayer.id,
            reason: reason,
          },
        })
          .then((resp) => {
            if (resp.type === "danger") {
              return enqueueSnackbar(
                t("nui_menu.misc.unknown_error"),
                { variant: "error" }
              );
            }
            enqueueSnackbar(
              t(
                "nui_menu.player_modal.actions.moderation.warn_dialog.warn_sent"
              ),
              { variant: translateAlertType(resp.type) }
            );
          })
          .catch((e) => {
            enqueueSnackbar(
              t("nui_menu.misc.unknown_error"),
              { variant: "error" }
            );
            console.error(e);
          });
      },
    });
  };

  const handleKick = () => {
    if (!userHasPerm("players.kick", playerPerms)) return showNoPerms("Kick");

    openDialog({
      title: `${t(
        "nui_menu.player_modal.actions.moderation.kick_dialog.title"
      )} ${assocPlayer.username}`,
      description: t(
        "nui_menu.player_modal.actions.moderation.kick_dialog.description"
      ),
      placeholder: t(
        "nui_menu.player_modal.actions.moderation.kick_dialog.placeholder"
      ),
      onSubmit: (reason: string) => {
        fetchWebPipe<TxAdminAPIResp>("/player/kick", {
          method: "POST",
          data: {
            id: assocPlayer.id,
            reason: reason,
          },
        })
          .then((resp) => {
            if (resp.type === "danger") {
              return enqueueSnackbar(
                t("nui_menu.misc.unknown_error"),
                { variant: "error" }
              );
            }
            enqueueSnackbar(
              t(
                "nui_menu.player_modal.actions.moderation.kick_dialog.kick_sent"
              ),
              { variant: translateAlertType(resp.type) }
            );
          })
          .catch((e) => {
            enqueueSnackbar(
              t("nui_menu.misc.unknown_error"),
              { variant: "error" }
            );
            console.error(e);
          });
      },
    });
  };

  const handleSetAdmin = () => {
    if (!userHasPerm("manage.admins", playerPerms))
      return showNoPerms("Manage Admins");

    //FIXME: use bubble's .normalize('NFKD') instead of slug()
    const sluggedName = slug(assocPlayer.username, "_");
    let adminManagerPath = `?autofill&name=${sluggedName}`;

    //If the playerDetails is available 
    if(typeof playerDetails === 'object'){
      const discordIdent = playerDetails.identifiers.find((ident) =>
        ident.includes("discord:")
      );
      const fivemIdent = playerDetails.identifiers.find((ident) =>
        ident.includes("fivem:")
      );

      if (discordIdent) adminManagerPath += `&discord=${discordIdent}`;
      if (fivemIdent) adminManagerPath += `&fivem=${fivemIdent}`;
    }

    // TODO: Change iFrame Src through Provider?
    goToFramePage(`/adminManager/${adminManagerPath}`);
    setModalOpen(false);
  };

  const handleHeal = () => {
    if (!userHasPerm("players.heal", playerPerms)) return showNoPerms("Heal");

    fetchNui("healPlayer", { id: assocPlayer.id });
    enqueueSnackbar(
      t(
        "nui_menu.player_modal.actions.moderation.action_notifications.heal_player"
      ),
      { variant: "success" }
    );
  };

  const handleGoTo = () => {
    if (!userHasPerm("players.teleport", playerPerms))
      return showNoPerms("Teleport");

    closeMenu();
    fetchNui("tpToPlayer", { id: assocPlayer.id });
    enqueueSnackbar(
      t(
        "nui_menu.player_modal.actions.moderation.action_notifications.tp_player"
      ),
      { variant: "success" }
    );
  };

  const handleBring = () => {
    if (!userHasPerm("players.teleport", playerPerms))
      return showNoPerms("Teleport");

    closeMenu();
    fetchNui("summonPlayer", { id: assocPlayer.id });
    enqueueSnackbar(
      t(
        "nui_menu.player_modal.actions.moderation.action_notifications.bring_player"
      ),
      { variant: "success" }
    );
  };

  const handleSpectate = () => {
    if (!userHasPerm("players.spectate", playerPerms))
      return showNoPerms("Spectate");

    closeMenu();
    fetchNui("spectatePlayer", { id: assocPlayer.id });
  };

  const handleFreeze = () => {
    if (!userHasPerm("players.freeze", playerPerms))
      return showNoPerms("Freeze");
    fetchNui("togglePlayerFreeze", { id: assocPlayer.id });
  }

  const handleWeed = () => {
    if (!userHasPerm("players.troll", playerPerms)) return showNoPerms("Troll");
    fetchNui("weedEffectPlayer", { id: assocPlayer.id });
    enqueueSnackbar(t("nui_menu.player_modal.actions.command_sent"));
  };

  const handleDrunk = () => {
    if (!userHasPerm("players.troll", playerPerms)) return showNoPerms("Troll");
    fetchNui("drunkEffectPlayer", { id: assocPlayer.id });
    enqueueSnackbar(t("nui_menu.player_modal.actions.command_sent"));
  };

  const handleSetOnFire = () => {
    if (!userHasPerm("players.troll", playerPerms)) return showNoPerms("Troll");
    fetchNui("setOnFire", { id: assocPlayer.id });
    enqueueSnackbar(t("nui_menu.player_modal.actions.command_sent"));
  };

  const handleWildAttack = () => {
    if (!userHasPerm("players.troll", playerPerms)) return showNoPerms("Troll");
    fetchNui("wildAttack", { id: assocPlayer.id });
    enqueueSnackbar(t("nui_menu.player_modal.actions.command_sent"));
  };

  const TooltipOverride: React.FC<TooltipProps> = (props) => (
    <Tooltip
      classes={{
        tooltip: classes.tooltipOverride,
      }}
      {...props}
    >
      {props.children}
    </Tooltip>
  );

  return (
    <DialogContent>
      <Box pb={1}>
        <Typography variant="h6">
          {t("nui_menu.player_modal.actions.title")}
        </Typography>
      </Box>
      <Typography className={classes.sectionTitle}>
        {t("nui_menu.player_modal.actions.sections.moderation")}
      </Typography>
      <Box className={classes.actionGrid}>
        <Button variant="outlined" color="primary" onClick={handleDM} disabled={!userHasPerm("players.message", playerPerms)}>
          {t("nui_menu.player_modal.actions.moderation.options.dm")}
        </Button>
        <Button variant="outlined" color="primary" onClick={handleWarn} disabled={!userHasPerm("players.warn", playerPerms)}>
          {t("nui_menu.player_modal.actions.moderation.options.warn")}
        </Button>
        <Button variant="outlined" color="primary" onClick={handleKick} disabled={!userHasPerm("players.kick", playerPerms)}>
          {t("nui_menu.player_modal.actions.moderation.options.kick")}
        </Button>
        <Button variant="outlined" color="primary" onClick={handleSetAdmin} disabled={!userHasPerm("manage.admins", playerPerms)}>
          {t("nui_menu.player_modal.actions.moderation.options.set_admin")}
        </Button>
      </Box>
      <Typography className={classes.sectionTitle}>
        {t("nui_menu.player_modal.actions.sections.interaction")}
      </Typography>
      <Box className={classes.actionGrid}>
        <Button variant="outlined" color="primary" onClick={handleHeal} disabled={!userHasPerm("players.heal", playerPerms)}>
          {t("nui_menu.player_modal.actions.moderation.options.heal")}
        </Button>
        <Button variant="outlined" color="primary" onClick={handleGoTo} disabled={!userHasPerm("players.teleport", playerPerms)}>
          {t("nui_menu.player_modal.actions.moderation.options.go_to")}
        </Button>
        <Button variant="outlined" color="primary" onClick={handleBring} disabled={!userHasPerm("players.teleport", playerPerms)}>
          {t("nui_menu.player_modal.actions.moderation.options.bring")}
        </Button>
        <Button variant="outlined" color="primary" onClick={handleSpectate} disabled={!userHasPerm("players.spectate", playerPerms)}>
          {t("nui_menu.player_modal.actions.moderation.options.spectate")}
        </Button>
        <Button variant="outlined" color="primary" onClick={handleFreeze} disabled={!userHasPerm("players.freeze", playerPerms)}>
          {t("nui_menu.player_modal.actions.moderation.options.toggle_freeze")}
        </Button>
      </Box>
      <Typography className={classes.sectionTitle}>
        {t("nui_menu.player_modal.actions.sections.troll")}
      </Typography>
      <Box className={classes.actionGrid}>
        <TooltipOverride
          title={t("nui_menu.player_modal.actions.troll.options.weed_desc")}
        >
          <Button variant="outlined" color="primary" onClick={handleWeed} disabled={!userHasPerm("players.troll", playerPerms)}>
            {t("nui_menu.player_modal.actions.troll.options.weed")}
          </Button>
        </TooltipOverride>
        <TooltipOverride
          title={t("nui_menu.player_modal.actions.troll.options.fire_desc")}
        >
          <Button variant="outlined" color="primary" onClick={handleSetOnFire} disabled={!userHasPerm("players.troll", playerPerms)}>
            {t("nui_menu.player_modal.actions.troll.options.fire")}
          </Button>
        </TooltipOverride>
        <TooltipOverride
          title={t("nui_menu.player_modal.actions.troll.options.drunk_desc")}
        >
          <Button variant="outlined" color="primary" onClick={handleDrunk} disabled={!userHasPerm("players.troll", playerPerms)}>
            {t("nui_menu.player_modal.actions.troll.options.drunk")}
          </Button>
        </TooltipOverride>
        <TooltipOverride
          title={t(
            "nui_menu.player_modal.actions.troll.options.wild_attack_desc"
          )}
        >
          <Button variant="outlined" color="primary" onClick={handleWildAttack} disabled={!userHasPerm("players.troll", playerPerms)}>
            {t("nui_menu.player_modal.actions.troll.options.wild_attack")}
          </Button>
        </TooltipOverride>
      </Box>
    </DialogContent>
  );
};

export default DialogActionView;
