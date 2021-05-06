import React from "react";
import { Box, makeStyles, Typography } from "@material-ui/core";
import { Error } from "@material-ui/icons";
import { useTranslate } from "react-polyglot";

const useStyles = makeStyles((theme) => ({
  root: {
    color: theme.palette.text.secondary,
    fontWeight: 300,
  },
  icon: {
    paddingRight: theme.spacing(2),
  },
}));

export const PlayersListEmpty: React.FC = () => {
  const classes = useStyles();
  const t = useTranslate();

  return (
    <Box
      display="flex"
      // flexDirection="column"
      height="100%"
      justifyContent="center"
      alignItems="center"
      className={classes.root}
    >
      <Error fontSize="large" color="inherit" className={classes.icon} />
      <Typography color="inherit" variant="h6">
        {t("nui_menu.page_players.misc.zero_players")}
      </Typography>
    </Box>
  );
};
