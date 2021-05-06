import { useSetIsMenuVisible } from "../state/visibility.state";
import { PlayerData, useSetPlayersState } from "../state/players.state";
import { txAdminMenuPage, useSetPage } from "../state/page.state";
import { useNuiEvent } from "./useNuiEvent";
import { useSetServerCtx } from "../state/server.state";
import { useSnackbar } from "notistack";
import { Box, Typography } from "@material-ui/core";
import React from "react";

type SnackbarAlertSeverities = "success" | "error" | "warning" | "info";

interface SnackbarAlert {
  key: number;
  level: SnackbarAlertSeverities;
  message: string;
}

interface AnnounceMessageProps {
  message: string;
}

const AnnounceMessage: React.FC<AnnounceMessageProps> = ({ message }) => (
  <Box maxWidth={200}>
    <Typography style={{ fontWeight: "bold" }}>Server Announcement</Typography>
    {message}
  </Box>
);

// Passive Message Event Listeners & Handlers for global state
export const useNuiListenerService = () => {
  const setVisible = useSetIsMenuVisible();
  const setPlayerState = useSetPlayersState();
  const setMenuPage = useSetPage();
  const setServerCtx = useSetServerCtx();
  const { enqueueSnackbar } = useSnackbar();

  useNuiEvent<boolean>("setVisible", setVisible);
  useNuiEvent<PlayerData[]>("setPlayerState", setPlayerState);
  useNuiEvent<txAdminMenuPage>("setMenuPage", setMenuPage);
  useNuiEvent("setServerCtx", setServerCtx);

  useNuiEvent<SnackbarAlert>("setSnackbarAlert", ({ level, message }) => {
    enqueueSnackbar(message, {
      variant: level,
    });
  });

  useNuiEvent("addAnnounceMessage", ({ message }: { message: string }) => {
    enqueueSnackbar(<AnnounceMessage message={message} />, {
      variant: "warning",
      title: "Server Announcement",
      anchorOrigin: {
        horizontal: "right",
        vertical: "top",
      },
    });
  });
};
