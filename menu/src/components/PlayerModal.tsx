import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
  Theme,
  makeStyles,
  useTheme,
  IconButton,
  ListItemIcon
} from "@material-ui/core";
import { Close, Person, Block, FormatListBulleted, MenuBook, FlashOn } from '@material-ui/icons'
import { usePlayerDetails } from "../state/players.state";
import { usePlayerModal, useTabs } from "../provider/PlayerProvider";

const useStyles = makeStyles((theme: Theme) => ({
  closeButton: {
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(2)
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: '80px 80px 80px 130px',
    columnGap: 10,
    rowGap: 10,
    paddingBottom: 15
  },
  codeBlock: {
    background: theme.palette.background.paper,
    borderRadius: 8,
    padding: '10px 10px',
    marginBottom: 7
  },
  codeBlockText: {
    fontFamily: "monospace"
  }
}))

const useDialogStyles = makeStyles((theme: Theme) => ({
  root: {
    '&$selected, &$selected:hover': {
      background: theme.palette.primary.main,
    }
  },
  banRoot: {
    '&$selected, &$selected:hover': {
      background: theme.palette.warning.main,
    }
  },
  selected: {}
}))

const PlayerModal: React.FC = () =>  {
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
          borderRadius: 15
        },
      }}
    >
      <DialogTitle style={{ borderBottom: '1px solid rgba(221,221,221,0.54)' }}>
        [{player.id}] {player.username}
        <IconButton onClick={handleClose} className={classes.closeButton}><Close /></IconButton>
      </DialogTitle>
        <Box display="flex" px={2} pb={2} pt={2} flexGrow={1} >
          <Box minWidth={200} pr={2} borderRight="1px solid rgba(221,221,221,0.54)">
            <DialogList />
          </Box>
          <Box flexGrow={1} mt={-2}>
            {tab == 1 && <DialogActionView />}
            {tab == 2 && <DialogInfoView />}
            {tab == 3 && <DialogIdView />}
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
      <ListItem style={{ borderRadius: 8 }} button onClick={() => setTab(1)} selected={tab === 1 && true} classes={{ root: classes.root, selected: classes.selected }}>
        <ListItemIcon><FlashOn /></ListItemIcon>
        <ListItemText primary="Actions" />
      </ListItem>
      <ListItem style={{ borderRadius: 8 }} button onClick={() => setTab(2)} selected={tab === 2 && true} classes={{ root: classes.root, selected: classes.selected }}>
        <ListItemIcon><Person /></ListItemIcon>
        <ListItemText primary="Info" />
      </ListItem>
      <ListItem style={{ borderRadius: 8 }} button onClick={() => setTab(3)} selected={tab === 3 && true} classes={{ root: classes.root, selected: classes.selected }}>
        <ListItemIcon><FormatListBulleted /></ListItemIcon>
        <ListItemText primary="IDs" />
      </ListItem>
      <ListItem style={{ borderRadius: 8 }} button onClick={() => setTab(4)} classes={{ root: classes.root, selected: classes.selected }}>
        <ListItemIcon><MenuBook /></ListItemIcon>
        <ListItemText primary="History" />
      </ListItem>
      <ListItem style={{ borderRadius: 8 }} button onClick={() => setTab(5)} selected={tab === 5 && true} classes={{ root: classes.banRoot, selected: classes.selected }}>
        <ListItemIcon><Block /></ListItemIcon>
        <ListItemText primary="Ban" />
      </ListItem>
    </List>
  )
}

const DialogActionView: React.FC = () => {
  const theme = useTheme();
  const classes = useStyles();

  return (
    <DialogContent>
      <Typography style={{ paddingBottom: 5 }}>Moderation</Typography>
      <Box className={classes.actionGrid}>
        <Button variant="outlined" color="primary">DM</Button>
        <Button variant="outlined" color="primary">Warn</Button>
        <Button variant="outlined" color="primary">Kick</Button>
        <Button variant="outlined" color="primary">Set Admin</Button>
      </Box>
      <Typography style={{ paddingBottom: 5 }}>Interaction</Typography>
      <Box className={classes.actionGrid}>
        <Button variant="outlined" color="primary">Heal</Button>
        <Button variant="outlined" color="primary">Go to</Button>
        <Button variant="outlined" color="primary">Bring</Button>
        <Button variant="outlined" color="primary">Spectate</Button>
      </Box>
      <Typography style={{ paddingBottom: 5 }}>Troll</Typography>
      <Box className={classes.actionGrid}>
        <Button variant="outlined" color="primary">Kill</Button>
        <Button variant="outlined" color="primary">Fire</Button>
        <Button variant="outlined" color="primary">Drunk</Button>
        <Button variant="outlined" color="primary">Wild attack</Button>
      </Box>
    </DialogContent>
  )
}

const DialogInfoView: React.FC = () => {
  const theme = useTheme();
  return (
    <DialogContent >
      <Typography variant="h6">Player Info</Typography>
      <Typography>Session Time: <span style={{ color: theme.palette.text.secondary }}>0 minutes</span></Typography>
      <Typography>Play time: <span style={{ color: theme.palette.text.secondary }}>--</span></Typography>
      <Typography>Joined: <span style={{ color: theme.palette.text.secondary }}>May 4, 2021 - 14:25:15</span></Typography>
      <TextField
        autoFocus
        margin="dense"
        id="name"
        label="Notes about this player"
        type="text"
        placeholder="Someting about Tabarra"
        variant="outlined"
        multiline
        rows={4}
        rowsMax={4}
        fullWidth
      />
    </DialogContent>
  )
}


const DialogIdView: React.FC = () => {
  const theme = useTheme();
  const classes = useStyles();

  return (
    <DialogContent>
      <Typography variant="h6" style={{ paddingBottom: 5 }}>Player Identifiers</Typography>
      <Box className={classes.codeBlock}>
        <Typography className={classes.codeBlockText} ><strong>steam:</strong><span style={{ color: theme.palette.text.secondary }}>32423422424424</span></Typography>
      </Box>
      <Box className={classes.codeBlock}>
        <Typography className={classes.codeBlockText}><strong>license:</strong><span style={{ color: theme.palette.text.secondary }}>32423422424424</span></Typography>
      </Box>
      <Box className={classes.codeBlock}>
        <Typography className={classes.codeBlockText}><strong>discord:</strong><span style={{ color: theme.palette.text.secondary }}>32423422424424</span></Typography>
      </Box>
      <Box className={classes.codeBlock}>
        <Typography className={classes.codeBlockText}><strong>xbl:</strong><span style={{ color: theme.palette.text.secondary }}>32423422424424</span></Typography>
      </Box>
      <Box className={classes.codeBlock}>
        <Typography className={classes.codeBlockText}><strong>fivem:</strong><span style={{ color: theme.palette.text.secondary }}>32423422424424</span></Typography>
      </Box>
    </DialogContent>
  )
}



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