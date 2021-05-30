import React from "react";
import { SnackbarKey, useSnackbar } from "notistack";
import { useNuiEvent } from "./useNuiEvent";
import { Box, Typography } from "@material-ui/core";
import { useTranslate } from "react-polyglot";
import { shouldHelpAlertShow } from '../utils/shouldHelpAlertShow';
import { debugData } from '../utils/debugLog';

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

debugData([
  {
    action: 'showMenuHelpInfo',
    data: {}
  }
], 5000)

export const useHudListenersService = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const t = useTranslate();

  const snackFormat = (m) => <span style={{whiteSpace: 'pre-wrap'}}>{m}</span>;

  useNuiEvent<SnackbarAlert>(
    "setSnackbarAlert",
    ({ level, message, isTranslationKey }) => {
      enqueueSnackbar(isTranslationKey ? snackFormat(t(message)) : snackFormat(message), {
        variant: level,
      });
    }
  );

  useNuiEvent('showMenuHelpInfo', () => {
    const showAlert = shouldHelpAlertShow()
    if (showAlert) {
      enqueueSnackbar(snackFormat(t('nui_menu.misc.help_message')), {
        variant: 'info',
        anchorOrigin: {
          horizontal: 'center',
          vertical: 'bottom'
        },
        autoHideDuration: 10000
      })
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
