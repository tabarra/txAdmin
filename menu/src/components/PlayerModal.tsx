import React from "react";
import {
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
} from "@material-ui/core";
import { usePlayerDetails } from "../state/players.state";
import { usePlayerModal, useTabs } from "../provider/PlayerProvider";

const PlayerModal: React.FC = () =>  {
  const player = usePlayerDetails();
  const { tab } = useTabs();
  const { modal, setModal } = usePlayerModal();

  if (!player) return null;


  const handleClose = (e) => {
    if (e.key === "Escape") {
      setModal(false)
    }
  }


  return (
    <Dialog open={modal} fullWidth onClose={handleClose}>
      <DialogTitle>
        [{player.id}] {player.username}
      </DialogTitle>
        <Grid container spacing={8}>
          <Grid item xs={3} md={3}>
            <DialogList />
          </Grid>
          <Grid item xs={8}>
            {tab == 1 && <DialogInfoView />}
            {tab == 2 && <DialogIdView />}
            {tab == 4 && <DialogBanView />} 
          </Grid>
        </Grid>
        <DialogActions>
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
  const { setTab } = useTabs();
  return (
    <List disablePadding>
      <ListItem button onClick={() => setTab(1)} divider>
        <ListItemText primary="Info" />
      </ListItem>
      <ListItem button onClick={() => setTab(2)} divider>
        <ListItemText primary="IDs" />
      </ListItem>
      <ListItem button divider>
        <ListItemText primary="History" />
      </ListItem>
      <ListItem button onClick={() => setTab(4)} divider>
        <ListItemText primary="Ban" />
      </ListItem>
    </List>
  )
}

const DialogInfoView: React.FC = () => (
  <DialogContent>
    <DialogContentText>Player Info</DialogContentText>
    <DialogContentText>Session Time: 0 minutes</DialogContentText>
    <DialogContentText>Play time: --</DialogContentText>
    <DialogContentText>Joined: May 4, 2021 - 14:25:15</DialogContentText>
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