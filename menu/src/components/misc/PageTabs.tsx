import React, { useCallback } from "react";
import { Box, styled, Tab, Tabs } from "@mui/material";
import { usePage } from "../../state/page.state";
import { useKey } from "../../hooks/useKey";
import { useTabDisabledValue } from "../../state/keys.state";
import { useIsMenuVisibleValue } from "../../state/visibility.state";
import { useServerCtxValue } from "../../state/server.state";

const StyledTab = styled(Tab)({
  minWidth: 100,
});

export const PageTabs: React.FC = () => {
  const [page, setPage] = usePage();
  const tabDisabled = useTabDisabledValue();
  const visible = useIsMenuVisibleValue();
  const serverCtx = useServerCtxValue();

  const handleTabPress = useCallback(() => {
    if (tabDisabled || !visible) return;
    setPage((prevState) => (prevState + 1 > 2 ? 0 : prevState + 1));
  }, [tabDisabled, visible]);

  useKey(serverCtx.switchPageKey, handleTabPress);

  return (
    <Box width="100%">
      <Tabs
        value={page}
        centered
        indicatorColor="primary"
        textColor="secondary"
        onChange={(_, newVal) => setPage(newVal)}
      >
        <StyledTab label="Main" wrapped disableFocusRipple />
        <StyledTab label="Players" wrapped disableFocusRipple />
        <StyledTab label="txAdmin" wrapped disableFocusRipple />
      </Tabs>
    </Box>
  );
};
