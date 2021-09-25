import React from "react";
import { useTranslate } from "react-polyglot";
import { Box, Typography } from "@mui/material";
import makeStyles from '@mui/styles/makeStyles';
import { Error } from "@mui/icons-material";

const useStyles = makeStyles((theme) => ({
  root: {
    color: theme.palette.text.secondary,
    fontWeight: 300,
  },
  icon: {
    paddingRight: theme.spacing(2),
  },
}));

interface PlayerModalHasErrorProps {
  msg: string;
}

export const PlayerModalHasError: React.FC<PlayerModalHasErrorProps> = ({
  msg,
}) => {
  const t = useTranslate();
  const classes = useStyles();

  return (
    <Box
      className={classes.root}
      flexGrow={1}
      mt={-2}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Box display="flex">
        <Error fontSize="large" color="inherit" className={classes.icon} />
        <Typography color="inherit" variant="h6">
          {t("nui_menu.player_modal.misc.error")}
        </Typography>
      </Box>
      <br />
      <code style={{ color: "red" }}>{msg}</code>
    </Box>
  );
};
