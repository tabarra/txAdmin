import React, { useEffect } from "react";
import { Box, styled } from "@mui/material";
import { IFramePostData, useIFrameCtx } from "../../provider/IFrameProvider";
import { debugLog } from "../../utils/debugLog";
import { usePermissionsValue } from "../../state/permissions.state";

const StyledIFrame = styled("iframe")({
  border: "0px",
  borderRadius: 15,
  height: "100%",
  width: "100%",
});

const StyledRoot = styled(Box)({
  backgroundColor: "#171718",
  height: "100%",
  borderRadius: 15,
});

export const IFramePage: React.FC<{ visible: boolean }> = ({ visible }) => {
  const { fullFrameSrc, handleChildPost } = useIFrameCtx();
  const userPerms = usePermissionsValue();

  // We will only use the provider's src value if the permissions
  // have been successfully fetched
  const trueFrameSource = Boolean(userPerms) ? fullFrameSrc : "about:blank";

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
    <StyledRoot mt={2} mb={10} display={visible ? "initial" : "none"}>
      {visible && <StyledIFrame src={trueFrameSource} />}
    </StyledRoot>
  );
};
