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
  Theme,
  CircularProgress,
} from "@mui/material";
import makeStyles from '@mui/styles/makeStyles';
import {
  Close,
  Person,
  Block,
  FormatListBulleted,
  MenuBook,
  FlashOn,
} from "@mui/icons-material";
import { usePlayerModalContext } from "../../provider/PlayerModalProvider";
import { useAssociatedPlayerValue } from "../../state/playerDetails.state";
import { useTranslate } from "react-polyglot";
import { DialogBaseView } from "./Tabs/DialogBaseView";
import { PlayerModalErrorBoundary } from "./ErrorHandling/PlayerModalErrorBoundary";

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

const useStyles = makeStyles((theme: Theme) => ({
  closeButton: {
    position: "absolute",
    top: theme.spacing(1),
    right: theme.spacing(2),
  },
}));

const PlayerModal: React.FC = () => {
  const classes = useStyles();
  const { setModalOpen, isModalOpen } = usePlayerModalContext();
  const assocPlayer = useAssociatedPlayerValue();
  const theme = useTheme();

  const handleClose = () => {
    setModalOpen(false);
  };

  if (!assocPlayer) return null;

  return (
    <Dialog
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
        id: "player-modal-container",
      }}
    >
      <DialogTitle style={{ borderBottom: "1px solid rgba(221,221,221,0.54)" }}>
        [{assocPlayer.id}] {assocPlayer.username}
        <IconButton onClick={handleClose} className={classes.closeButton} size="large">
          <Close />
        </IconButton>
      </DialogTitle>
      <Box display="flex" px={2} pb={2} pt={2} flexGrow={1} overflow="hidden">
        <PlayerModalErrorBoundary>
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
        </PlayerModalErrorBoundary>
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
      background: theme.palette.error.main,
    },
  },
  selected: {},
}));

const DialogList: React.FC = () => {
  const { tab, setTab } = usePlayerModalContext();
  const classes = useListStyles();
  const t = useTranslate();

  return (
    <List>
      <ListItem
        className={classes.listItem}
        button
        onClick={() => setTab(1)}
        selected={tab === 1}
        classes={{ root: classes.root, selected: classes.selected }}
      >
        <ListItemIcon>
          <FlashOn />
        </ListItemIcon>
        <ListItemText primary={t("nui_menu.player_modal.tabs.actions")} />
      </ListItem>
      <ListItem
        className={classes.listItem}
        button
        onClick={() => setTab(2)}
        selected={tab === 2}
        classes={{ root: classes.root, selected: classes.selected }}
      >
        <ListItemIcon>
          <Person />
        </ListItemIcon>
        <ListItemText primary={t("nui_menu.player_modal.tabs.info")} />
      </ListItem>
      <ListItem
        className={classes.listItem}
        button
        onClick={() => setTab(3)}
        selected={tab === 3}
        classes={{ root: classes.root, selected: classes.selected }}
      >
        <ListItemIcon>
          <FormatListBulleted />
        </ListItemIcon>
        <ListItemText primary={t("nui_menu.player_modal.tabs.ids")} />
      </ListItem>
      <ListItem
        className={classes.listItem}
        button
        onClick={() => setTab(4)}
        selected={tab === 4}
        classes={{ root: classes.root, selected: classes.selected }}
      >
        <ListItemIcon>
          <MenuBook />
        </ListItemIcon>
        <ListItemText primary={t("nui_menu.player_modal.tabs.history")} />
      </ListItem>
      <ListItem
        className={classes.listItem}
        button
        onClick={() => setTab(5)}
        selected={tab === 5}
        classes={{ root: classes.banRoot, selected: classes.selected }}
      >
        <ListItemIcon>
          <Block />
        </ListItemIcon>
        <ListItemText primary={t("nui_menu.player_modal.tabs.ban")} />
      </ListItem>
    </List>
  );
};

export default PlayerModal;
