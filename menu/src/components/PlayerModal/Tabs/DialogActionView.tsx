import React from "react";
import { Box, Button, DialogContent, Typography } from "@material-ui/core";
import { useStyles } from "../modal.styles";
import { useAssociatedPlayerValue, usePlayerDetailsValue } from '../../../state/playerDetails.state';
import { fetchWebPipe } from '../../../utils/fetchWebPipe';
import { fetchNui } from '../../../utils/fetchNui';
import { useDialogContext } from '../../../provider/DialogProvider';
import { useSnackbar } from 'notistack';

const DialogActionView: React.FC = () => {
  const classes = useStyles();
  const { openDialog } = useDialogContext()
  const playerDetails = usePlayerDetailsValue()
  const assocPlayer = useAssociatedPlayerValue()
  const { enqueueSnackbar } = useSnackbar()

  const handleDM = () => {
    openDialog({
      title: `Direct Message ${assocPlayer.username}`,
      description: 'What is the reason for direct messaging this player?',
      placeholder: 'Reason...',
      onSubmit: (reason: string) => {
        fetchWebPipe('/player/kick', {
          method: 'POST',
          data: {
            id: assocPlayer.id,
            reason: reason
          }
        }).then(resp => {
          // TODO: Handle response
          enqueueSnackbar('Warned player!', { variant: 'success' })
        }).catch(e => {
          enqueueSnackbar('Warned player!', { variant: 'success' })
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
        fetchWebPipe('/player/kick', {
          method: 'POST',
          data: {
            id: assocPlayer.id,
            reason: reason
          }
        }).then(resp => {
          // TODO: Handle response
          enqueueSnackbar('Warned player!', { variant: 'success' })
        }).catch(e => {
          enqueueSnackbar('Warned player!', { variant: 'success' })
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
          // TODO: Handle response
          enqueueSnackbar('Kicked player!', { variant: 'success' })
        }).catch(e => {

        })
      }
    })
  }

  const handleSetAdmin = () => {
    // TODO: Change iFrame Src through Provider?
  }

  const handleHeal = () => {
    fetchNui('healPlayer', { id: assocPlayer.id })
  }

  const handleGoTo = () => {
    fetchNui('goToPlayer', { id: assocPlayer.id })
  }

  const handleBring = () => {
    fetchNui('bringPlayer', { id: assocPlayer.id })
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
        <Button variant="outlined" color="primary">Set Admin</Button>
      </Box>
      <Typography style={{ paddingBottom: 5 }}>Interaction</Typography>
      <Box className={classes.actionGrid}>
        <Button variant="outlined" color="primary" onClick={handleHeal}>Heal</Button>
        <Button variant="outlined" color="primary" onClick={handleGoTo}>Go to</Button>
        <Button variant="outlined" color="primary" onClick={handleBring}>Bring</Button>
        {/*<Button variant="outlined" color="primary">Spectate</Button>*/}
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