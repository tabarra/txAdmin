import React from "react";
import { SnackbarKey, useSnackbar } from "notistack";
import { useNuiEvent } from "./useNuiEvent";
import { Box, Typography } from "@material-ui/core";
import { useTranslate } from "react-polyglot";

type SnackbarAlertSeverities = "success" | "error" | "warning" | "info";

interface SnackbarAlert {
  level: SnackbarAlertSeverities;
  message: string;
  isTranslationKey?: boolean;
}

interface SnackbarPersistentAlert extends SnackbarAlert {
  key: string;
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

const alertMap = new Map<string, SnackbarKey>();

export const useHudListenersService = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const t = useTranslate();

  useNuiEvent<SnackbarAlert>(
    "setSnackbarAlert",
    ({ level, message, isTranslationKey }) => {
      enqueueSnackbar(isTranslationKey ? t(message) : message, {
        variant: level,
      });
    }
  );

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
            horizontal: "right",
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
