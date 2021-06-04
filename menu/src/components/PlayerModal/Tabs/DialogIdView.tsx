import React from "react";
import {
  Box,
  DialogContent,
  IconButton,
  makeStyles,
  Theme,
  Typography,
} from "@material-ui/core";
import { usePlayerDetailsValue } from "../../../state/playerDetails.state";
import { FileCopy } from "@material-ui/icons";
import { copyToClipboard } from "../../../utils/copyToClipboard";
import { useSnackbar } from "notistack";

const useStyles = makeStyles((theme: Theme) => ({
  codeBlock: {
    background: theme.palette.background.paper,
    borderRadius: 8,
    padding: "5px 5px",
    marginBottom: 7,
    display: "flex",
    alignItems: "center",
  },
  codeBlockText: {
    flexGrow: 1,
    fontFamily: "monospace",
  },
}));

const DialogIdView: React.FC = () => {
  const classes = useStyles();
  const player = usePlayerDetailsValue();
  const { enqueueSnackbar } = useSnackbar();

  const handleCopyToClipboard = (value: string) => {
    copyToClipboard(value);
    enqueueSnackbar("Copied to clipboard!", { variant: "info" });
  };

  return (
    <DialogContent>
      {player.identifiers.map((ident) => (
        <Box className={classes.codeBlock} key={ident}>
          <Typography className={classes.codeBlockText}>{ident}</Typography>
          <IconButton onClick={() => handleCopyToClipboard(ident)}>
            <FileCopy />
          </IconButton>
        </Box>
      ))}
    </DialogContent>
  );
};

export default DialogIdView;
