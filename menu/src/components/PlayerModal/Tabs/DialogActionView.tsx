import React from "react";
import {
  Box,
  Button,
  DialogContent,
  makeStyles,
  Typography,
} from "@material-ui/core";
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
    display: "grid",
    gridTemplateColumns: "80px 80px 80px 130px",
    columnGap: 10,
    rowGap: 10,
    paddingBottom: 15,
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
      title: `${t("nui_menu.player_modal.actions.moderation.dm_dialog.title")} ${assocPlayer.username}`,
      description: t("nui_menu.player_modal.actions.moderation.dm_dialog.description"),
      placeholder: t("nui_menu.player_modal.actions.moderation.dm_dialog.placeholder"),
      onSubmit: (reason: string) => {
        fetchWebPipe<TxAdminAPIResp>("/player/message", {
          method: "POST",
          data: {
            id: assocPlayer.id,
            message: reason
          }
        }).then(resp => {
          enqueueSnackbar(t("nui_menu.player_modal.actions.moderation.dm_dialog.dm_sent"), { variant: translateAlertType(resp.type) })
        }).catch(e => {
          enqueueSnackbar(t("nui_menu.player_modal.actions.moderation.dm_dialog.unknown_error"), { variant: 'error' })
          console.error(e)
        })
      },
    });
  };

  const handleWarn = () => {
    if (!userHasPerm("players.warn", playerPerms)) return showNoPerms("Warn");

    openDialog({
      title: `${t("nui_menu.player_modal.actions.moderation.warn_dialog.title")} ${assocPlayer.username}`,
      description: t("nui_menu.player_modal.actions.moderation.warn_dialog.description"),
      placeholder: 'Reason...',
      onSubmit: (reason: string) => {
        fetchWebPipe<TxAdminAPIResp>("/player/warn", {
          method: "POST",
          data: {
            id: assocPlayer.id,
            reason: reason
          }
        }).then(resp => {
          if (resp.type === 'danger') {
            return enqueueSnackbar(t("nui_menu.player_modal.actions.moderation.warn_dialog.unknown_error"), { variant: 'error' })
          }
          enqueueSnackbar(t("nui_menu.player_modal.actions.moderation.warn_dialog.warn_sent"), { variant: translateAlertType(resp.type) })
        }).catch(e => {
          enqueueSnackbar(t("nui_menu.player_modal.actions.moderation.warn_dialog.unknown_error"), { variant: 'error' })
          console.error(e)
        })
      },
    });
  };

  const handleKick = () => {
    if (!userHasPerm("players.kick", playerPerms)) return showNoPerms("Kick");

    openDialog({
      title: `${t("nui_menu.player_modal.actions.moderation.kick_dialog.title")} ${assocPlayer.username}`,
      description: t("nui_menu.player_modal.actions.moderation.kick_dialog.description"),
      placeholder: t("nui_menu.player_modal.actions.moderation.kick_dialog.placeholder"),
      onSubmit: (reason: string) => {
        fetchWebPipe<TxAdminAPIResp>("/player/kick", {
          method: "POST",
          data: {
            id: assocPlayer.id,
            reason: reason
          }
        }).then(resp => {
          if (resp.type === 'danger') {
            return enqueueSnackbar(t("nui_menu.player_modal.actions.moderation.kick_dialog.unknown_error"), { variant: 'error' })
          }
          enqueueSnackbar(t("nui_menu.player_modal.actions.moderation.kick_dialog.kick_sent"), { variant: translateAlertType(resp.type) })
        }).catch(e => {
          enqueueSnackbar(t("nui_menu.player_modal.actions.moderation.kick_dialog.unknown_error"), { variant: 'error' })
          console.error(e)
        })
      },
    });
  };

  const handleSetAdmin = () => {
    if (!userHasPerm("manage.admins", playerPerms))
      return showNoPerms("Manage Admins");

    // TODO: Change iFrame Src through Provider?
    const discordIdent = playerDetails.identifiers.find((ident) =>
      ident.includes("discord:")
    );
    const fivemIdent = playerDetails.identifiers.find((ident) =>
      ident.includes("fivem:")
    );

    const sluggedName = slug(assocPlayer.username, "_");

    let adminManagerPath = `?autofill&name=${sluggedName}`;
    if (discordIdent)
      adminManagerPath = adminManagerPath + `&discord=${discordIdent}`;
    if (fivemIdent)
      adminManagerPath = adminManagerPath + `&fivem=${fivemIdent}`;

    goToFramePage(`/adminManager/${adminManagerPath}`);
    setModalOpen(false);
  };

  const handleHeal = () => {
    if (!userHasPerm("players.heal", playerPerms)) return showNoPerms("Heal");

    fetchNui('healPlayer', { id: assocPlayer.id })
    enqueueSnackbar(t("nui_menu.player_modal.actions.moderation.action_notifications.heal_player"), {variant: 'success'})
  }

  const handleGoTo = () => {
    if (!userHasPerm("players.teleport", playerPerms))
      return showNoPerms("Teleport");

    closeMenu();
    fetchNui('tpToPlayer', { id: assocPlayer.id })
    enqueueSnackbar(t("nui_menu.player_modal.actions.moderation.action_notifications.tp_player"), {variant: 'success'})
  }

  const handleBring = () => {
    if (!userHasPerm("players.teleport", playerPerms))
      return showNoPerms("Teleport");

    closeMenu();
    fetchNui('summonPlayer', { id: assocPlayer.id })
    enqueueSnackbar(t("nui_menu.player_modal.actions.moderation.action_notifications.bring_player"), {variant: 'success'})
  }

  const handleSpectate = () => {
    if (!userHasPerm("players.spectate", playerPerms))
      return showNoPerms("Spectate");

    closeMenu();
    fetchNui("spectatePlayer", { id: assocPlayer.id });
  };

  return (
    <DialogContent>
      <Box pb={1}>
        <Typography variant="h6">Player Actions</Typography>
      </Box>
      <Typography style={{ paddingBottom: 5 }}>Moderation</Typography>
      <Box className={classes.actionGrid}>
        <Button variant="outlined" color="primary" onClick={handleDM}>{t("nui_menu.player_modal.actions.moderation.options.dm")}</Button>
        <Button variant="outlined" color="primary" onClick={handleWarn}>{t("nui_menu.player_modal.actions.moderation.options.warn")}</Button>
        <Button variant="outlined" color="primary" onClick={handleKick}>{t("nui_menu.player_modal.actions.moderation.options.kick")}</Button>
        <Button variant="outlined" color="primary" onClick={handleSetAdmin}>{t("nui_menu.player_modal.actions.moderation.options.set_admin")}</Button>
      </Box>
      <Typography style={{ paddingBottom: 5 }}>
        {t("nui_menu.player_modal.actions.interaction.category_title_2")}
      </Typography>
      <Box className={classes.actionGrid}>
        <Button variant="outlined" color="primary" onClick={handleHeal}>{t("nui_menu.player_modal.actions.moderation.options.heal")}</Button>
        <Button variant="outlined" color="primary" onClick={handleGoTo}>{t("nui_menu.player_modal.actions.moderation.options.go_to")}</Button>
        <Button variant="outlined" color="primary" onClick={handleBring}>{t("nui_menu.player_modal.actions.moderation.options.bring")}</Button>
        <Button variant="outlined" color="primary" onClick={handleSpectate}>{t("nui_menu.player_modal.actions.moderation.options.spectate")}</Button>
      </Box>
      {/*<Typography style={{ paddingBottom: 5 }}>Troll</Typography>*/}
      {/*<Box className={classes.actionGrid}>*/}
      {/*  <Button variant="outlined" color="primary">Kill</Button>*/}
      {/*  <Button variant="outlined" color="primary">Fire</Button>*/}
      {/*  <Button variant="outlined" color="primary">Drunk</Button>*/}
      {/*  <Button variant="outlined" color="primary">Wild attack</Button>*/}
      {/*</Box>*/}
    </DialogContent>
  );
};

export default DialogActionView;
