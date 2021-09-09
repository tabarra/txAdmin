import React from "react";
import { Box, IconButton, Theme, Typography } from "@mui/material";
import makeStyles from '@mui/styles/makeStyles';
import { usePlayerDetailsValue } from "../../../state/playerDetails.state";
import { FileCopy } from "@mui/icons-material";
import { copyToClipboard } from "../../../utils/copyToClipboard";
import { useSnackbar } from "notistack";
import { useTranslate } from "react-polyglot";
import { DialogLoadError } from "./DialogLoadError";

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
  const t = useTranslate();

  if(typeof player !== 'object'){
    return <DialogLoadError />;
  }

  const handleCopyToClipboard = (value: string) => {
    copyToClipboard(value, true);
    enqueueSnackbar(t("nui_menu.common.copied"), { variant: "info" });
  };

  return (
    <Box overflow="auto" height="100%" padding="8px 24px">
      {player.identifiers.map((ident) => (
        <Box className={classes.codeBlock} key={ident}>
          <Typography className={classes.codeBlockText}>{ident}</Typography>
          <IconButton onClick={() => handleCopyToClipboard(ident)} size="large">
            <FileCopy />
          </IconButton>
        </Box>
      ))}
    </Box>
  );
};

export default DialogIdView;
