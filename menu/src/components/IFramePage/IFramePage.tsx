import React, { useEffect } from "react";
import { Box, makeStyles, Theme } from "@material-ui/core";
import { IFramePostData, useIFrameCtx } from "../../provider/IFrameProvider";
import { debugLog } from "../../utils/debugLog";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    backgroundColor: theme.palette.background.default,
    height: "100%",
    borderRadius: 15,
  },
  iframe: {
    border: "0px",
    borderRadius: 15,
    height: "100%",
    width: "100%",
  },
}));

export const IFramePage: React.FC<{ visible: boolean }> = ({ visible }) => {
  const classes = useStyles();

  const { fullFrameSrc, handleChildPost } = useIFrameCtx();

  // Handles listening for postMessage requests from iFrame
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data: IFramePostData =
        typeof event.data === "string" ? JSON.parse(event.data) : event.data;

      if (!data?.__isFromChild) return;

      debugLog("Post from iFrame", data);

      handleChildPost(data);
    };

    window.addEventListener("message", handler);

    return () => window.removeEventListener("message", handler);
  }, [handleChildPost]);

  return (
    <Box
      className={classes.root}
      mt={2}
      mb={10}
      display={visible ? "initial" : "none"}
    >
      <iframe src={fullFrameSrc} className={classes.iframe} />
    </Box>
  );
};
