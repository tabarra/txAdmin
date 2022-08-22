import React from "react";
import { Box, Collapse, Typography } from "@mui/material";
import { PageTabs } from "./misc/PageTabs";
import { MainPageList } from "./MainPage/MainPageList";
import { PlayersPage } from "./PlayersPage/PlayersPage";
import { IFramePage } from "./IFramePage/IFramePage";
import { txAdminMenuPage, usePageValue } from "../state/page.state";
import { useHudListenersService } from "../hooks/useHudListenersService";
import { HelpTooltip } from "./misc/HelpTooltip";
import { useServerCtxValue } from "../state/server.state";
import { styled } from "@mui/material";

const TxAdminLogo: React.FC = () => (
  <Box my={1} display="flex" justifyContent="center">
    <img src="images/txadmin.png" alt="txAdmin logo" />
  </Box>
);

const StyledRoot = styled(Box)(({ theme }) => ({
  height: "fit-content",
  background: theme.palette.background.default,
  width: 325,
  borderRadius: 15,
  display: "flex",
  flexDirection: "column",
  userSelect: "none",
}));

const MenuRoot: React.FC = () => {
  const serverCtx = useServerCtxValue();
  // We need to mount this here so we can get access to
  // the translation context
  useHudListenersService();

  const curPage = usePageValue();
  const padSize = Math.max(0, 9 - serverCtx.txAdminVersion.length);
  const versionPad = "\u0020\u205F".repeat(padSize);

  return (
    <>
      <Box
        style={{
          width: "fit-content",
          alignSelf: serverCtx.alignRight ? "flex-end" : "auto",
        }}
      >
        <HelpTooltip>
          <StyledRoot p={2} pb={1}>
            <TxAdminLogo />
            <Typography
              color="textSecondary"
              style={{
                fontWeight: 500,
                marginTop: -20,
                textAlign: "right",
                fontSize: 12,
              }}
            >
              v{serverCtx.txAdminVersion}
              {versionPad}
            </Typography>
            <PageTabs />
            <Collapse
              in={curPage === txAdminMenuPage.Main}
              unmountOnExit
              mountOnEnter
            >
              <MainPageList />
            </Collapse>
          </StyledRoot>
        </HelpTooltip>
      </Box>
      <PlayersPage visible={curPage === txAdminMenuPage.Players} />
      <IFramePage visible={curPage === txAdminMenuPage.IFrame} />
    </>
  );
};

export default MenuRoot;
