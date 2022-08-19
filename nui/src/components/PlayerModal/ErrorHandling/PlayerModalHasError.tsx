import React from "react";
import { useTranslate } from "react-polyglot";
import { Box, styled, Typography } from "@mui/material";
import { Error } from "@mui/icons-material";

const BoxRoot = styled(Box)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontWeight: 300,
}));

const ErrorIcon = styled(Error)(({ theme }) => ({
  paddingRight: theme.spacing(2),
}));

interface PlayerModalHasErrorProps {
  msg: string;
}

export const PlayerModalHasError: React.FC<PlayerModalHasErrorProps> = ({
  msg,
}) => {
  const t = useTranslate();

  return (
    <BoxRoot
      flexGrow={1}
      mt={-2}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Box display="flex">
        <ErrorIcon fontSize="large" color="inherit" />
        <Typography color="inherit" variant="h6">
          {t("nui_menu.player_modal.misc.error")}
        </Typography>
      </Box>
      <br />
      <code style={{ color: "red" }}>{msg}</code>
    </BoxRoot>
  );
};
