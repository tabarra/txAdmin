import React from "react";
import { Box, DialogContent, Typography } from "@material-ui/core";
import { useStyles } from "../modal.styles";
import { usePlayerDetailsValue } from "../../../state/playerDetails.state";

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
