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
  CircularProgress,
} from "@mui/material";
import { styled } from '@mui/material/styles';
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
import { usePermissionsValue } from "../../state/permissions.state";
import { userHasPerm } from "../../utils/miscUtils";
import React from "react";


const classes = {
  listItem: `PlayerModal-listItem`,
  listItemBan: `PlayerModal-listItemBan`,
};

const StyledList = styled(List)(({ theme }) => ({
  [`& .${classes.listItem}`]: {
    borderRadius: 8,
    '&.Mui-selected:hover': {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
    },
  },

  [`& .${classes.listItemBan}`]: {
    borderRadius: 8,
    '&:hover, &.Mui-selected': {
      background: theme.palette.error.main,
    },
    '&.Mui-selected:hover': {
      backgroundColor: "rgba(194,13,37, 0.8)",
    },
  },
}));

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

const StyledCloseButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(1),
  right: theme.spacing(2),
}));

const PlayerModal: React.FC = () => {
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
        [{assocPlayer.id}] {assocPlayer.name}
        <StyledCloseButton onClick={handleClose} size="large">
          <Close />
        </StyledCloseButton>
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

const DialogList: React.FC = () => {
  const { tab, setTab } = usePlayerModalContext();
  const t = useTranslate();
  const playerPerms = usePermissionsValue();

  return (
    <StyledList>
      <ListItem
        className={classes.listItem}
        button
        onClick={() => setTab(1)}
        selected={tab === 1}
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
      >
        <ListItemIcon>
          <MenuBook />
        </ListItemIcon>
        <ListItemText primary={t("nui_menu.player_modal.tabs.history")} />
      </ListItem>
      <ListItem
        className={classes.listItemBan}
        button
        disabled={!userHasPerm("players.ban", playerPerms)}
        onClick={() => setTab(5)}
        selected={tab === 5}
      >
        <ListItemIcon>
          <Block />
        </ListItemIcon>
        <ListItemText primary={t("nui_menu.player_modal.tabs.ban")} />
      </ListItem>
    </StyledList>
  );
};

export default PlayerModal;
