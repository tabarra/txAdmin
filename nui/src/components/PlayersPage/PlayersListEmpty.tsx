import React from "react";
import { Box, styled, Typography } from "@mui/material";
import { Error } from "@mui/icons-material";
import { useTranslate } from "react-polyglot";

const BoxRoot = styled(Box)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontWeight: 300,
}));

const ErrorIcon = styled(Error)(({ theme }) => ({
  paddingRight: theme.spacing(2),
}));

export const PlayersListEmpty: React.FC = () => {
  const t = useTranslate();

  return (
    <BoxRoot
      display="flex"
      // flexDirection="column"
      height="100%"
      justifyContent="center"
      alignItems="center"
    >
      <ErrorIcon fontSize="large" color="inherit" />
      <Typography color="inherit" variant="h6">
        {t("nui_menu.page_players.misc.zero_players")}
      </Typography>
    </BoxRoot>
  );
};
