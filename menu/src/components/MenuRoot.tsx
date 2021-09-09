import React from "react";
import { Box, Collapse, Theme, Typography } from "@mui/material";
import makeStyles from '@mui/styles/makeStyles';
import { PageTabs } from "./misc/PageTabs";
import { MainPageList } from "./MainPage/MainPageList";
import { PlayersPage } from "./PlayersPage/PlayersPage";
import { IFramePage } from "./IFramePage/IFramePage";
import { txAdminMenuPage, usePageValue } from "../state/page.state";
import { useHudListenersService } from "../hooks/useHudListenersService";
import { HelpTooltip } from "./misc/HelpTooltip";
import { usePermissionsValue } from "../state/permissions.state";
import { useServerCtxValue } from '../state/server.state';

const TxAdminLogo: React.FC = () => (
  <Box my={1} display="flex" justifyContent="center">
    <img src="assets/images/txadmin_beta.png" alt="txadmin bro" />
  </Box>
);

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    height: "fit-content",
    background: theme.palette.background.default,
    width: 325,
    borderRadius: 15,
    display: "flex",
    flexDirection: "column",
    userSelect: "none",
  },
}));

const MenuRoot: React.FC = () => {
  const classes = useStyles();
  const perms = usePermissionsValue();
  const serverCtx = useServerCtxValue();
  // We need to mount this here so we can get access to
  // the translation context
  useHudListenersService();

  const curPage = usePageValue();
  const padSize = Math.max(0, 9-serverCtx.txAdminVersion.length);
  const versionPad = '\u0020\u205F'.repeat(padSize);

  if (!perms) return null;

  return (
    <>
      <Box
        style={{
          width: "fit-content",
          alignSelf: serverCtx.alignRight ? 'flex-end' : 'auto'
        }}>
        <HelpTooltip>
          <Box p={2} pb={1} className={classes.root}>
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
              v{serverCtx.txAdminVersion}{versionPad}
            </Typography>
            <PageTabs />
            <Collapse
              in={curPage === txAdminMenuPage.Main}
              unmountOnExit
              mountOnEnter
            >
              <MainPageList />
            </Collapse>
          </Box>
        </HelpTooltip>
      </Box>
      <PlayersPage visible={curPage === txAdminMenuPage.Players} />
      <IFramePage visible={curPage === txAdminMenuPage.IFrame} />
    </>
  );
};

export default MenuRoot;
