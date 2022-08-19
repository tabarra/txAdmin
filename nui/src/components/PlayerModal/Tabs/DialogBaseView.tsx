import React from "react";
import DialogActionView from "./DialogActionView";
import DialogInfoView from "./DialogInfoView";
import DialogIdView from "./DialogIdView";
import DialogHistoryView from "./DialogHistoryView";
import DialogBanView from "./DialogBanView";
import { Box } from "@mui/material";
import { usePlayerModalContext } from "../../../provider/PlayerModalProvider";

export const DialogBaseView: React.FC = () => {
  const { tab } = usePlayerModalContext();

  return (
    <Box flexGrow={1} mt={-2} overflow="hidden">
      {tab == 1 && <DialogActionView />}
      {tab == 2 && <DialogInfoView />}
      {tab == 3 && <DialogIdView />}
      {tab == 4 && <DialogHistoryView />}
      {tab == 5 && <DialogBanView />}
    </Box>
  );
};
