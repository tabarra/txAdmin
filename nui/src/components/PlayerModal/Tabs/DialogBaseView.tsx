import React from "react";
import DialogActionView from "./DialogActionView";
import DialogInfoView from "./DialogInfoView";
import DialogIdView from "./DialogIdView";
import DialogHistoryView from "./DialogHistoryView";
import DialogBanView from "./DialogBanView";
import {Box} from "@mui/material";
import {PlayerModalTabs, usePlayerModalTabValue} from "@nui/src/state/playerModal.state";

const tabToRender = (tab: PlayerModalTabs) => {
  switch (tab) {
    case PlayerModalTabs.ACTIONS:
      return <DialogActionView />
    case PlayerModalTabs.INFO:
      return <DialogInfoView />
    case PlayerModalTabs.IDENTIFIERS:
      return <DialogIdView />
    case PlayerModalTabs.HISTORY:
      return <DialogHistoryView />
    case PlayerModalTabs.BAN:
      return <DialogBanView />
  }
}

export const DialogBaseView: React.FC = () => {
  const curTab = usePlayerModalTabValue()

  return (
    <Box flexGrow={1} mt={-2} overflow="hidden">
      {tabToRender(curTab)}
    </Box>
  );
};
