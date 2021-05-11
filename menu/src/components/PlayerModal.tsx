import React, { useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
  Theme,
  makeStyles,
  useTheme
} from "@material-ui/core";
import { usePlayerDetails } from "../state/players.state";
import { usePlayerModal, useTabs } from "../provider/PlayerProvider";

const useStyles = makeStyles((theme: Theme) => ({
  overrideDialogPaper: {
    backgroundColor: theme.palette.background.default,
  }
}))

const useDialogStyles = makeStyles((theme: Theme) => ({
  root: {
    '&$selected, &$selected:hover': {
      background: theme.palette.primary.main,
    }
  },
  selected: {}
}))

const PlayerModal: React.FC = () =>  {
  const player = usePlayerDetails();
  const { tab } = useTabs();
  const { modal, setModal } = usePlayerModal();
  const theme = useTheme();

  if (!player) return null;


  const handleClose = (e) => {
    if (e.key === "Escape") {
      setModal(false)
    }
  }

  return (
    <Dialog 
      open={modal} 
      fullWidth 
      onClose={handleClose} 
      maxWidth="md" 
      PaperProps={{
        style: {
          backgroundColor: theme.palette.background.default,
          minHeight: 600
        },
      }}
    >
      <DialogTitle>
        [{player.id}] {player.username}
      </DialogTitle>
        <Box display="flex" px={2}>
          <Box minWidth={200}>
            <DialogList />
          </Box>
          <Box flexGrow={1} mt={-2}>
            {tab == 1 && <DialogInfoView />}
            {tab == 2 && <DialogIdView />}
            {tab == 4 && <DialogBanView />} 
          </Box>
        </Box>
        <DialogActions style={{ marginRight: 30 }}>
          <Button color="primary">
            DM
          </Button>
          <Button color="primary">
            Kick
          </Button>
          <Button color="primary">
            Warn
          </Button>
        </DialogActions>
      </Dialog>
  )
}

const DialogList: React.FC = () => {
  const { tab, setTab } = useTabs();
  const classes = useDialogStyles();
  return (
    <List>
      <ListItem button onClick={() => setTab(1)} divider selected={tab === 1 && true} classes={{ root: classes.root, selected: classes.selected }}>
        <ListItemText primary="Info" />
      </ListItem>
      <ListItem button onClick={() => setTab(2)} divider selected={tab === 2 && true} classes={{ root: classes.root, selected: classes.selected }}>
        <ListItemText primary="IDs" />
      </ListItem>
      <ListItem button onClick={() => setTab(3)} divider classes={{ root: classes.root, selected: classes.selected }}>
        <ListItemText primary="History" />
      </ListItem>
      <ListItem button onClick={() => setTab(4)} divider selected={tab === 4 && true} classes={{ root: classes.root, selected: classes.selected }}>
        <ListItemText primary="Ban" />
      </ListItem>
    </List>
  )
}

const DialogInfoView: React.FC = () => (
  <DialogContent >
    <Typography variant="h6">Player Info</Typography>
    <Typography>Session Time: 0 minutes</Typography>
    <Typography>Play time: --</Typography>
    <Typography>Joined: May 4, 2021 - 14:25:15</Typography>
    <TextField
      autoFocus
      margin="dense"
      id="name"
      label="Notes about this player"
      type="text"
      variant="outlined"
      multiline
      rows={4}
      rowsMax={4}
      fullWidth
    />
  </DialogContent>
)

const DialogIdView: React.FC = () => (
  <DialogContent>
    <DialogContentText>Player Identfifers</DialogContentText>
    <DialogContentText>steam: 32423422424424</DialogContentText>
    <DialogContentText>licenese: 32423422424424</DialogContentText>
    <DialogContentText>xbl: 32423422424424</DialogContentText>
    <DialogContentText>live: 32423422424424</DialogContentText>
    <DialogContentText>discord: 32423422424424</DialogContentText>
  </DialogContent>
)

const DialogBanView: React.FC = () => {
  return (
    <DialogContent>
      <DialogContentText>Ban Player</DialogContentText>
      <TextField
        autoFocus
        margin="dense"
        id="name"
        label="Reason"
        required
        type="text"
        variant="outlined"
        multiline
        rows={2}
        rowsMax={2}
        fullWidth
      />
      <TextField
        autoFocus
        margin="dense"
        id="name"
        label="Duration"
        required
        type="text"
        variant="outlined"
        multiline
        rows={2}
        rowsMax={2}
        fullWidth
      />
      <Button variant="contained" color="primary" style={{ marginTop: 2 }}>Ban</Button>
    </DialogContent>
  )
}

export default PlayerModal;