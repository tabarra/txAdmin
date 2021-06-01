import React from "react";
import {
  Box,
  DialogContent,
  makeStyles,
  Theme,
  Typography,
} from "@material-ui/core";
import { usePlayerDetailsValue } from "../../../state/playerDetails.state";

const useStyles = makeStyles((theme: Theme) => ({
  codeBlock: {
    background: theme.palette.background.paper,
    borderRadius: 8,
    padding: "10px 10px",
    marginBottom: 7,
  },
  codeBlockText: {
    fontFamily: "monospace",
  },
}));

const DialogIdView: React.FC = () => {
  const classes = useStyles();
  const player = usePlayerDetailsValue();

  return (
    <DialogContent>
      {player.identifiers.map((ident) => (
        <Box className={classes.codeBlock} key={ident}>
          <Typography className={classes.codeBlockText}>{ident}</Typography>
        </Box>
      ))}
    </DialogContent>
  );
};

export default DialogIdView;
