import React from "react";
import { styled } from '@mui/material/styles';
import { Box, IconButton, Theme, Typography } from "@mui/material";
import { usePlayerDetailsValue } from "../../../state/playerDetails.state";
import { FileCopy } from "@mui/icons-material";
import { copyToClipboard } from "../../../utils/copyToClipboard";
import { useSnackbar } from "notistack";
import { useTranslate } from "react-polyglot";
import { DialogLoadError } from "./DialogLoadError";

const PREFIX = 'DialogIdView';

const classes = {
  codeBlock: `${PREFIX}-codeBlock`,
  codeBlockText: `${PREFIX}-codeBlockText`
};

const StyledBox = styled(Box)(({ theme }) => ({
  [`& .${classes.codeBlock}`]: {
    background: theme.palette.background.paper,
    borderRadius: 8,
    padding: "0px 15px",
    marginBottom: 7,
    display: "flex",
    alignItems: "center",
  },

  [`& .${classes.codeBlockText}`]: {
    flexGrow: 1,
    fontFamily: "monospace",
  }
}));

const DialogIdView: React.FC = () => {

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
    <StyledBox overflow="auto" height="100%" padding="8px 24px">
      {player.identifiers.map((ident) => (
        <Box className={classes.codeBlock} key={ident}>
          <Typography className={classes.codeBlockText}>{ident}</Typography>
          <IconButton onClick={() => handleCopyToClipboard(ident)} size="large">
            <FileCopy />
          </IconButton>
        </Box>
      ))}
    </StyledBox>
  );
};

export default DialogIdView;
