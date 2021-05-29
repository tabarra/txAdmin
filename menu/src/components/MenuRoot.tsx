import React from "react";
import {
  Box,
  Collapse,
  makeStyles,
  Theme,
} from "@material-ui/core";
import { PageTabs } from "./misc/PageTabs";
import { MainPageList } from "./MainPage/MainPageList";
import { PlayersPage } from "./PlayersPage/PlayersPage";
import { IFramePage } from "./IFramePage/IFramePage";
import { txAdminMenuPage, usePageValue } from "../state/page.state";
import { useHudListenersService } from "../hooks/useHudListenersService";
import { HelpTooltip } from './misc/HelpTooltip';
import { usePermissionsValue } from '../state/permissions.state';


const TxAdminLogo: React.FC = () => (
  <Box my={1} display="flex" justifyContent="center">
    <img src="assets/images/txadmin.png" alt="txadmin bro" />
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
  const perms = usePermissionsValue()
  // We need to mount this here so we can get access to
  // the translation context
  useHudListenersService();

  const curPage = usePageValue();

  if (!perms) return null

  return (
    <>
      <Box style={{ width: "fit-content" }}>
        <HelpTooltip>
          <Box p={2} pb={0} className={classes.root}>
            <TxAdminLogo />
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
