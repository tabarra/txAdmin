import React from "react";
import { SnackbarKey, useSnackbar } from "notistack";
import { useNuiEvent } from "./useNuiEvent";
import { Box, Typography } from "@mui/material";
import { useTranslate } from "react-polyglot";
import { shouldHelpAlertShow } from "../utils/shouldHelpAlertShow";
import { debugData } from "../utils/debugData";
import { getNotiDuration } from "../utils/getNotiDuration";
import {
  usePlayersState,
  useSetPlayerFilter,
  useSetPlayersFilterIsTemp,
} from "../state/players.state";
import { useSetAssociatedPlayer } from "../state/playerDetails.state";
import { txAdminMenuPage, useSetPage } from "../state/page.state";
import { useAnnounceNotiPosValue } from "../state/server.state";
import { useSetPlayerModalVisibility } from "@nui/src/state/playerModal.state";
import cleanPlayerName from "@shared/cleanPlayerName";
import { usePlayerModalContext } from "../provider/PlayerModalProvider";
import { fetchNui } from "../utils/fetchNui";

type SnackbarAlertSeverities = "success" | "error" | "warning" | "info";

interface SnackbarAlert {
  level: SnackbarAlertSeverities;
  message: string;
  isTranslationKey?: boolean;
  tOptions?: object;
}

interface SnackbarPersistentAlert extends SnackbarAlert {
  key: string;
}

interface AnnounceMessageProps {
  title: string;
  message: string;
}

export interface AddAnnounceData {
  message: string;
  author: string;
  isDirectMessage: boolean;
}

const AnnounceMessage: React.FC<AnnounceMessageProps> = ({
  title,
  message,
}) => (
  <Box maxWidth={400} style={{ fontSize: "large" }}>
    <Typography style={{ fontWeight: "bold" }}>{title}</Typography>
    {message}
  </Box>
);

const alertMap = new Map<string, SnackbarKey>();

debugData(
  [
    {
      action: "showMenuHelpInfo",
      data: {},
    },
  ],
  5000
);

const announcementSound = new Audio("sounds/announcement.mp3");
const messageSound = new Audio("sounds/message.mp3");

export const useHudListenersService = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const t = useTranslate();
  const onlinePlayers = usePlayersState();
  const setAssocPlayer = useSetAssociatedPlayer();
  const setModalOpen = useSetPlayerModalVisibility();
  const setPlayerFilter = useSetPlayerFilter();
  const setPlayersFilterIsTemp = useSetPlayersFilterIsTemp();
  const setPage = useSetPage();
  const notiPos = useAnnounceNotiPosValue();
  const { closeMenu } = usePlayerModalContext();

  const snackFormat = (m: string) => (
    <span style={{ whiteSpace: "pre-wrap" }}>{m}</span>
  );

  useNuiEvent<SnackbarAlert>(
    "setSnackbarAlert",
    ({ level, message, isTranslationKey, tOptions }) => {
      if (isTranslationKey) {
        message = t(message, tOptions);
      }
      enqueueSnackbar(
        snackFormat(message),
        { variant: level }
      );
    }
  );

  useNuiEvent("showMenuHelpInfo", () => {
    const showAlert = shouldHelpAlertShow();
    if (showAlert) {
      enqueueSnackbar(snackFormat(t("nui_menu.misc.help_message")), {
        variant: "info",
        anchorOrigin: {
          horizontal: "center",
          vertical: "bottom",
        },
        autoHideDuration: 10000,
      });
    }
  });

  useNuiEvent<SnackbarPersistentAlert>(
    "setPersistentAlert",
    ({ level, message, key, isTranslationKey }) => {
      if (alertMap.has(key)) return;
      const snackbarItem = enqueueSnackbar(
        isTranslationKey ? t(message) : message,
        {
          variant: level,
          persist: true,
          anchorOrigin: {
            horizontal: "center",
            vertical: "top",
          },
        }
      );
      alertMap.set(key, snackbarItem);
    }
  );

  useNuiEvent("clearPersistentAlert", ({ key }) => {
    const snackbarItem = alertMap.get(key);
    if (!snackbarItem) return;
    closeSnackbar(snackbarItem);
    alertMap.delete(key);
  });

  // Handler for dynamically opening the player page & player modal with target
  useNuiEvent<string>("openPlayerModal", (target) => {
    let targetPlayer;

    //Search by ID
    const targetId = parseInt(target);
    if (!isNaN(targetId)) {
      targetPlayer = onlinePlayers.find(
        (playerData) => playerData.id === targetId
      );
    }

    //Search by pure name
    if (!targetPlayer && typeof target === "string") {
      const searchInput = cleanPlayerName(target).pureName;
      const foundPlayers = onlinePlayers.filter((playerData) =>
        playerData.pureName?.includes(searchInput)
      );

      if (foundPlayers.length === 1) {
        targetPlayer = foundPlayers[0];
      } else if (foundPlayers.length > 1) {
        setPlayerFilter(target);
        setPage(txAdminMenuPage.Players);
        setPlayersFilterIsTemp(true);
        return;
      }
    }

    if (targetPlayer) {
      setPage(txAdminMenuPage.PlayerModalOnly);
      setAssocPlayer(targetPlayer);
      setModalOpen(true);
    } else {
      closeMenu();
      setModalOpen(false);
      enqueueSnackbar(
        t("nui_menu.player_modal.misc.target_not_found", { target }),
        { variant: "error" }
      );
    }
  });

  useNuiEvent<AddAnnounceData>("addAnnounceMessage", ({ message, author }) => {
    announcementSound.play();
    enqueueSnackbar(
      <AnnounceMessage
        message={message}
        title={t("nui_menu.misc.announcement_title", { author })}
      />,
      {
        variant: "warning",
        autoHideDuration: getNotiDuration(message) * 1000,
        anchorOrigin: {
          horizontal: notiPos.horizontal,
          vertical: notiPos.vertical,
        },
      }
    );
  });

  useNuiEvent<AddAnnounceData>("addDirectMessage", ({ message, author }) => {
    messageSound.play();
    enqueueSnackbar(
      <AnnounceMessage
        message={message}
        title={t("nui_menu.misc.directmessage_title", { author })}
      />,
      {
        variant: "info",
        autoHideDuration: getNotiDuration(message) * 1000 * 2, //*2 to slow things down
        anchorOrigin: {
          horizontal: notiPos.horizontal,
          vertical: notiPos.vertical,
        },
      }
    );
  });
};
