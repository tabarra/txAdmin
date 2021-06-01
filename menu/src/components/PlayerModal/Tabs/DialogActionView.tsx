import React from "react";
import { Box, Button, DialogContent, Typography } from "@material-ui/core";
import { useStyles } from "../modal.styles";
import { useAssociatedPlayerValue, usePlayerDetailsValue } from '../../../state/playerDetails.state';
import { fetchWebPipe } from '../../../utils/fetchWebPipe';
import { fetchNui } from '../../../utils/fetchNui';
import { useDialogContext } from '../../../provider/DialogProvider';
import { useSnackbar } from 'notistack';
import { useIFrameCtx} from "../../../provider/IFrameProvider";
import slug from 'slug'
import { usePlayerModalContext } from '../../../provider/PlayerModalProvider';
import { translateAlertType } from '../../../utils/miscUtils';
import { useTranslate } from "react-polyglot";

export type TxAdminActionRespType = 'success' | 'warning' | 'danger'

interface txAdminActionResp {
  type: TxAdminActionRespType
  message: string
}

const DialogActionView: React.FC = () => {
  const classes = useStyles();
  const { openDialog } = useDialogContext()
  const playerDetails = usePlayerDetailsValue()
  const assocPlayer = useAssociatedPlayerValue()
  const { enqueueSnackbar } = useSnackbar()
  const t = useTranslate();
  const { goToFramePage } = useIFrameCtx()
  const { setModalOpen, closeMenu } = usePlayerModalContext()

  const handleDM = () => {
    openDialog({
      title: `Direct Message ${assocPlayer.username}`,
      description: 'What is the reason for direct messaging this player?',
      placeholder: 'Reason...',
      onSubmit: (reason: string) => {
        fetchWebPipe<txAdminActionResp>('/player/message', {
          method: 'POST',
          data: {
            id: assocPlayer.id,
            message: reason
          }
        }).then(resp => {
          enqueueSnackbar('Your DM has been sent!', { variant: translateAlertType(resp.type) })
        }).catch(e => {
          enqueueSnackbar('An unknown error occurred', { variant: 'error' })
          console.error(e)
        })
      }
    })
  }

  const handleWarn = () => {
    openDialog({
      title: `Warn ${assocPlayer.username}`,
      description: 'What is the reason for direct warning this player?',
      placeholder: 'Reason...',
      onSubmit: (reason: string) => {
        fetchWebPipe('/player/warn', {
          method: 'POST',
          data: {
            id: assocPlayer.id,
            reason: reason
          }
        }).then(resp => {
          enqueueSnackbar('The player was warned!', { variant: translateAlertType(resp.type) })
        }).catch(e => {
          enqueueSnackbar('An unknown error occurred', { variant: 'error' })
          console.error(e)
        })
      }
    })
  }

  const handleKick = () => {
    openDialog({
      title: `Kick ${assocPlayer.username}`,
      description: 'What is the reason for kicking this player?',
      placeholder: 'Reason...',
      onSubmit: (reason: string) => {
        fetchWebPipe('/player/kick', {
          method: 'POST',
          data: {
            id: assocPlayer.id,
            reason: reason
          }
        }).then(resp => {
          enqueueSnackbar('The player was kicked!', { variant: translateAlertType(resp.type) })
        }).catch(e => {
          enqueueSnackbar('An unknown error has occurred', { variant: 'error' })
          console.error(e)
        })
      }
    })
  }

  const handleSetAdmin = () => {
    // TODO: Change iFrame Src through Provider?
    const discordIdent = playerDetails.identifiers.find(ident => ident.includes('discord:'))
    const fivemIdent = playerDetails.identifiers.find(ident => ident.includes('fivem:'))

    const sluggedName = slug(assocPlayer.username, '_')

    let adminManagerPath = `?autofill&name=${sluggedName}`
    if (discordIdent) adminManagerPath = adminManagerPath + `&discord=${discordIdent}`
    if (fivemIdent) adminManagerPath = adminManagerPath + `&fivem=${fivemIdent}`

    goToFramePage(`/adminManager/${adminManagerPath}`)
    setModalOpen(false)
  }

  const handleHeal = () => {
    fetchNui('healPlayer', { id: assocPlayer.id })
    enqueueSnackbar('Healing player', {variant: 'success'})
  }

  const handleGoTo = () => {
    fetchNui('tpToPlayer', { id: assocPlayer.id })
    enqueueSnackbar('Teleporting to player', {variant: 'success'})
  }

  const handleBring = () => {
    fetchNui('summonPlayer', { id: assocPlayer.id })
    enqueueSnackbar('Summoning player.', {variant: 'success'})
  }

  const handleSpectate = () => {
    closeMenu()
    fetchNui('spectatePlayer', { id: assocPlayer.id })
  }

  return (
    <DialogContent>
      <Box pb={1}>
        <Typography variant="h6">Player Actions</Typography>
      </Box>
      <Typography style={{ paddingBottom: 5 }}>Moderation</Typography>
      <Box className={classes.actionGrid}>
        <Button variant="outlined" color="primary" onClick={handleDM}>DM</Button>
        <Button variant="outlined" color="primary" onClick={handleWarn}>Warn</Button>
        <Button variant="outlined" color="primary" onClick={handleKick}>Kick</Button>
        <Button variant="outlined" color="primary" onClick={handleSetAdmin}>Set Admin</Button>
      </Box>
      <Typography style={{ paddingBottom: 5 }}>{t("nui_menu.player_modal.actions.interaction.category_title_2")}</Typography>
      <Box className={classes.actionGrid}>
        <Button variant="outlined" color="primary" onClick={handleHeal}>Heal</Button>
        <Button variant="outlined" color="primary" onClick={handleGoTo}>Go to</Button>
        <Button variant="outlined" color="primary" onClick={handleBring}>Bring</Button>
        <Button variant="outlined" color="primary" onClick={handleSpectate}>Spectate</Button>
      </Box>
      {/*<Typography style={{ paddingBottom: 5 }}>Troll</Typography>*/}
      {/*<Box className={classes.actionGrid}>*/}
      {/*  <Button variant="outlined" color="primary">Kill</Button>*/}
      {/*  <Button variant="outlined" color="primary">Fire</Button>*/}
      {/*  <Button variant="outlined" color="primary">Drunk</Button>*/}
      {/*  <Button variant="outlined" color="primary">Wild attack</Button>*/}
      {/*</Box>*/}
    </DialogContent>
  )
}

export default DialogActionView;