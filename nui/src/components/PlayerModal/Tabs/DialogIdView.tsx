import React from "react";
import { styled } from '@mui/material/styles';
import { Box, IconButton, Typography } from "@mui/material";
import { usePlayerDetailsValue } from "../../../state/playerDetails.state";
import { FileCopy } from "@mui/icons-material";
import { copyToClipboard } from "../../../utils/copyToClipboard";
import { useSnackbar } from "notistack";
import { useTranslate } from "react-polyglot";
import { DialogLoadError } from "./DialogLoadError";

const PREFIX = 'DialogIdView';

const classes = {
  codeBlock: `${PREFIX}-codeBlock`,
  codeBlockText: `${PREFIX}-codeBlockText`,
  codeBlockHwids: `${PREFIX}-codeBlockHwids`
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
  },

  [`& .${classes.codeBlockHwids}`]: {
    flexGrow: 1,
    fontFamily: "monospace",
    padding: '15px 0px',
    fontSize: '0.95rem',
    opacity: '0.75'
  }
}));

const DialogIdView: React.FC = () => {
  const playerDetails = usePlayerDetailsValue();
  const { enqueueSnackbar } = useSnackbar();
  const t = useTranslate();
  if ('error' in playerDetails) return (<DialogLoadError />);

  const handleCopyToClipboard = (value: string) => {
    copyToClipboard(value, true);
    enqueueSnackbar(t("nui_menu.common.copied"), { variant: "info" });
  };

  const getCurrentIds = () => {
    if (!Array.isArray(playerDetails.player.ids) || !playerDetails.player.ids.length) {
      return <em>No identifiers saved.</em>
    } else {
      return playerDetails.player.ids.map((ident) => (
        <Box className={classes.codeBlock} key={ident}>
          <Typography className={classes.codeBlockText}>{ident}</Typography>
          <IconButton onClick={() => handleCopyToClipboard(ident)} size="large">
            <FileCopy />
          </IconButton>
        </Box>
      ))
    }
  }

  const getOldIds = () => {
    if (!Array.isArray(playerDetails.player.oldIds) || !playerDetails.player.oldIds.length) {
      return <em>No identifiers saved.</em>
    } else {
      const filtered = playerDetails.player.oldIds.filter(id => !playerDetails.player.ids.includes(id));
      if (!filtered.length) {
        return <em>No identifiers saved.</em>
      } else {
        return playerDetails.player.oldIds.map((ident) => (
          <Box className={classes.codeBlock} key={ident}>
            <Typography className={classes.codeBlockText}>{ident}</Typography>
            <IconButton onClick={() => handleCopyToClipboard(ident)} size="large">
              <FileCopy />
            </IconButton>
          </Box>
        ));
      }
    }
  }

  const getAllHwids = () => {
    if (!Array.isArray(playerDetails.player.oldHwids) || !playerDetails.player.oldHwids.length) {
      return <em>No HWIDs saved.</em>
    } else {
      return <Box className={classes.codeBlock}>
        <span className={classes.codeBlockHwids}>
          {playerDetails.player.oldHwids.join('\n')}
        </span>
      </Box>
    }
  }

  return (
    <StyledBox overflow="auto" height="100%" padding="8px 24px">
      <Typography variant="h6" sx={{ mb: 1 }}>{t("nui_menu.player_modal.ids.current_ids")}:</Typography>
      <Box sx={{ mb: 2 }}>
        {getCurrentIds()}
      </Box>

      <Typography variant="h6" sx={{ mb: 1 }}>{t("nui_menu.player_modal.ids.previous_ids")}:</Typography>
      <Box sx={{ mb: 2 }}>
        {getOldIds()}
      </Box>

      <Typography variant="h6" sx={{ mb: 1 }}>{t("nui_menu.player_modal.ids.all_hwids")}:</Typography>
      <Box sx={{ mb: 2 }}>
        {getAllHwids()}
      </Box>
    </StyledBox>
  );
};

export default DialogIdView;
