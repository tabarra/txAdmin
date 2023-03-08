import React, {
  useContext,
  createContext,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import PlayerModal from "../components/PlayerModal/PlayerModal";
import { useSetDisableTab, useSetListenForExit } from "../state/keys.state";
import { useIsMenuVisible } from "../state/visibility.state";
import { fetchNui } from "../utils/fetchNui";
import { useSnackbar } from "notistack";
import { Box, CircularProgress, Dialog, useTheme } from "@mui/material";
import {
  usePlayerModalVisibility,
  useSetPlayerModalTab,
} from "@nui/src/state/playerModal.state";

const PlayerContext = createContext<PlayerProviderCtx>({} as PlayerProviderCtx);

interface PlayerProviderCtx {
  closeMenu: () => void;
  showNoPerms: (opt: string) => void;
}

interface PlayerModalProviderProps {
  children: ReactNode;
}

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

export const PlayerModalProvider: React.FC<PlayerModalProviderProps> = ({
  children,
}) => {
  const [modalOpen, setModalOpen] = usePlayerModalVisibility();
  const setDisableTabNav = useSetDisableTab();
  const setListenForExit = useSetListenForExit();
  const { enqueueSnackbar } = useSnackbar();
  const [menuVisible, setMenuVisible] = useIsMenuVisible();
  const setTab = useSetPlayerModalTab();
  const theme = useTheme();

  useEffect(() => {
    setDisableTabNav(modalOpen);
    setListenForExit(!modalOpen);
    setTimeout(() => {
      if (!modalOpen) setTab(0);
    }, 500);
  }, [modalOpen]);

  // In case the modal is open when menu visibility is toggled
  // we need to close the modal as a result
  useEffect(() => {
    if (!menuVisible && modalOpen) setModalOpen(false);
  }, [menuVisible]);

  // Will close both the modal and set the menu to invisible
  const closeMenu = useCallback(() => {
    setModalOpen(false);
    setMenuVisible(false);
    fetchNui("closeMenu");
  }, []);

  const showNoPerms = useCallback((opt: string) => {
    enqueueSnackbar(`You do not have permissions for "${opt}"`, {
      variant: "error",
    });
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        showNoPerms,
        closeMenu,
      }}
    >
      <Dialog
        open={modalOpen}
        fullWidth
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        PaperProps={{
          style: {
            backgroundColor: theme.palette.background.default,
            minHeight: 450,
            maxHeight: 650,
            borderRadius: 15,
          },
          id: "player-modal-container",
        }}
      >
        <React.Suspense fallback={<LoadingModal />}>
          <PlayerModal />
        </React.Suspense>
      </Dialog>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayerModalContext = () => useContext(PlayerContext);
