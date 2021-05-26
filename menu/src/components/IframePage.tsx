import React from "react";
import { Box, makeStyles, Theme } from "@material-ui/core";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    backgroundColor: theme.palette.background.default,
    height: "100%",
    borderRadius: 15,
  },
  iframe: {
    border: '0px',
    borderRadius: 15,
    height: '100%',
    width: '100%',
  }
}));

export const IframePage: React.FC<{ visible: boolean }> = ({ visible }) => {
  const classes = useStyles();

  return (
    <Box
      className={classes.root}
      mt={2}
      mb={10}
      display={visible ? "initial" : "none"}
    >
      <iframe src="http://localhost:40120/" className={classes.iframe}></iframe>
    </Box>
  );
};
