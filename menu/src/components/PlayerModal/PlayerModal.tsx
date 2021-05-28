import React, { useState } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  useTheme,
  IconButton,
  ListItemIcon
} from "@material-ui/core";
import { Close, Person, Block, FormatListBulleted, MenuBook, FlashOn, TerrainTwoTone } from '@material-ui/icons'
import { usePlayerDetails } from "../../state/players.state";
import { usePlayerModal, useTabs } from "../../provider/PlayerProvider";
import DialogBanView from "./Tabs/DialogBanView";
import DialogActionView from "./Tabs/DialogActionView";
import DialogInfoView from "./Tabs/DialogInfoView";
import { useDialogStyles, useStyles } from "./modal.styles";
import DialogIdView from "./Tabs/DialogIdView";
import DialogHistoryView from "./Tabs/DialogHistoryView";

const PlayerModal: React.FC = () => {
  const player = usePlayerDetails();
  const { tab } = useTabs();
  const { modal, setModal } = usePlayerModal();
  const theme = useTheme();
  const classes = useStyles();

  
  if (!player) return null;
  
  
  
  const handleClose = (e) => {
    setModal(false)
  }

  return (
    <Dialog
      disableEscapeKeyDown
      open={modal}
      fullWidth
      onClose={handleClose}
      maxWidth="md"
      PaperProps={{
        style: {
          backgroundColor: theme.palette.background.default,
          minHeight: 450,
          maxHeight: 450,
          borderRadius: 15
        },
      }}
    >
      <DialogTitle style={{ borderBottom: '1px solid rgba(221,221,221,0.54)' }}>
        [{player.id}] {player.username}
        <IconButton onClick={handleClose} className={classes.closeButton}><Close/></IconButton>
      </DialogTitle>
      <Box display="flex" px={2} pb={2} pt={2} flexGrow={1}>
        <Box minWidth={200} pr={2} borderRight="1px solid rgba(221,221,221,0.54)">
          <DialogList/>
        </Box>
        <Box flexGrow={1} mt={-2}>
          {tab == 1 && <DialogActionView />}
          {tab == 2 && <DialogInfoView />}
          {tab == 3 && <DialogIdView />}
          {tab == 4 && <DialogHistoryView />}
          {tab == 5 && <DialogBanView />}
        </Box>
      </Box>
    </Dialog>
  )
}

const DialogList: React.FC = () => {
  const { tab, setTab } = useTabs();
  const classes = useDialogStyles();
  return (
    <List>
      <ListItem
        style={{ borderRadius: 8 }}
        button
        onClick={() => setTab(1)}
        selected={tab === 1 && true}
        classes={{ root: classes.root, selected: classes.selected }}
      >
        <ListItemIcon><FlashOn/></ListItemIcon>
        <ListItemText primary="Actions"/>
      </ListItem>
      <ListItem
        style={{ borderRadius: 8 }}
        button
        onClick={() => setTab(2)} selected={tab === 2 && true}
        classes={{ root: classes.root, selected: classes.selected }}
      >
        <ListItemIcon><Person/></ListItemIcon>
        <ListItemText primary="Info"/>
      </ListItem>
      <ListItem
        style={{ borderRadius: 8 }}
        button
        onClick={() => setTab(3)}
        selected={tab === 3 && true}
        classes={{ root: classes.root, selected: classes.selected }}
      >
        <ListItemIcon><FormatListBulleted/></ListItemIcon>
        <ListItemText primary="IDs"/>
      </ListItem>
      <ListItem
        style={{ borderRadius: 8 }}
        button
        onClick={() => setTab(4)}
        selected={tab === 4 && true}
        classes={{ root: classes.root, selected: classes.selected }}
      >
        <ListItemIcon><MenuBook/></ListItemIcon>
        <ListItemText primary="History"/>
      </ListItem>
      <ListItem
        style={{ borderRadius: 8 }}
        button
        onClick={() => setTab(5)}
        selected={tab === 5 && true}
        classes={{ root: classes.banRoot, selected: classes.selected }}
      >
        <ListItemIcon><Block/></ListItemIcon>
        <ListItemText primary="Ban"/>
      </ListItem>
    </List>
  )
}

export default PlayerModal;