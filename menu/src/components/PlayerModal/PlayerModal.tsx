import React from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  useTheme,
  IconButton,
  ListItemIcon,
  makeStyles,
  Theme,
  CircularProgress,
} from "@material-ui/core";
import {
  Close,
  Person,
  Block,
  FormatListBulleted,
  MenuBook,
  FlashOn,
} from "@material-ui/icons";
import { usePlayerModalContext } from "../../provider/PlayerModalProvider";
import { useStyles } from "./modal.styles";
import { useAssociatedPlayerValue } from "../../state/playerDetails.state";
import { DialogBaseView } from "./Tabs/DialogBaseView";

const LoadingModal: React.FC = () => (
  <Box
    display="flex"
    flexGrow={1}
    width="100%"
    justifyContent="center"
    alignItems="center"
  >
    <CircularProgress />
  </Box>
);

const PlayerModal: React.FC = () => {
  const classes = useStyles();
  const { setModalOpen, isModalOpen } = usePlayerModalContext();
  const assocPlayer = useAssociatedPlayerValue();
  const theme = useTheme();

  // Actually fetch the details for this particular ID
  const handleClose = () => {
    setModalOpen(false);
  };

  if (!assocPlayer) return null;

  return (
    <Dialog
      disableEscapeKeyDown
      open={isModalOpen}
      fullWidth
      onClose={handleClose}
      maxWidth="md"
      PaperProps={{
        style: {
          backgroundColor: theme.palette.background.default,
          minHeight: 450,
          maxHeight: 450,
          borderRadius: 15,
        },
      }}
    >
      <DialogTitle style={{ borderBottom: "1px solid rgba(221,221,221,0.54)" }}>
        [{assocPlayer.id}] {assocPlayer.username}
        <IconButton onClick={handleClose} className={classes.closeButton}>
          <Close />
        </IconButton>
      </DialogTitle>
      <Box display="flex" px={2} pb={2} pt={2} flexGrow={1}>
        <Box
          minWidth={200}
          pr={2}
          borderRight="1px solid rgba(221,221,221,0.54)"
        >
          <DialogList />
        </Box>
        <React.Suspense fallback={<LoadingModal />}>
          <DialogBaseView />
        </React.Suspense>
      </Box>
    </Dialog>
  );
};

const useListStyles = makeStyles((theme: Theme) => ({
  listItem: {
    borderRadius: 8,
  },
  root: {
    "&$selected, &$selected:hover": {
      background: theme.palette.primary.main,
    },
  },
  banRoot: {
    "&$selected, &$selected:hover": {
      background: theme.palette.warning.main,
    },
  },
  selected: {},
}));

const DialogList: React.FC = () => {
  const { tab, setTab } = usePlayerModalContext();
  const classes = useListStyles();
  return (
    <List>
      <ListItem
        className={classes.listItem}
        button
        onClick={() => setTab(1)}
        selected={tab === 1 && true}
        classes={{ root: classes.root, selected: classes.selected }}
      >
        <ListItemIcon>
          <FlashOn />
        </ListItemIcon>
        <ListItemText primary="Actions" />
      </ListItem>
      <ListItem
        className={classes.listItem}
        button
        onClick={() => setTab(2)}
        selected={tab === 2 && true}
        classes={{ root: classes.root, selected: classes.selected }}
      >
        <ListItemIcon>
          <Person />
        </ListItemIcon>
        <ListItemText primary="Info" />
      </ListItem>
      <ListItem
        className={classes.listItem}
        button
        onClick={() => setTab(3)}
        selected={tab === 3 && true}
        classes={{ root: classes.root, selected: classes.selected }}
      >
        <ListItemIcon>
          <FormatListBulleted />
        </ListItemIcon>
        <ListItemText primary="IDs" />
      </ListItem>
      <ListItem
        className={classes.listItem}
        button
        onClick={() => setTab(4)}
        selected={tab === 4 && true}
        classes={{ root: classes.root, selected: classes.selected }}
      >
        <ListItemIcon>
          <MenuBook />
        </ListItemIcon>
        <ListItemText primary="History" />
      </ListItem>
      <ListItem
        className={classes.listItem}
        button
        onClick={() => setTab(5)}
        selected={tab === 5 && true}
        classes={{ root: classes.banRoot, selected: classes.selected }}
      >
        <ListItemIcon>
          <Block />
        </ListItemIcon>
        <ListItemText primary="Ban" />
      </ListItem>
    </List>
  );
};

export default PlayerModal;
