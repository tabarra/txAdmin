import React from "react";
import {Box, Collapse, makeStyles, Theme} from "@material-ui/core";
import { PageTabs } from "./PageTabs";
import { MainPageList } from "./MainPageList";
import { PlayersPage } from "./PlayersPage";
import { IframePage } from "./IframePage";
import { txAdminMenuPage, usePageValue } from "../state/page.state";
import { useHudListenersService } from "../hooks/useHudListenersService";

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
  },
}));

const MenuRoot: React.FC = () => {
  const classes = useStyles();
  // We need to mount this here so we can get access to
  // the translation context
  useHudListenersService();

  const curPage = usePageValue();

  return (
   <>
      <Box p={2} pb={0} className={classes.root}>
        <TxAdminLogo />
        <PageTabs />
        <Collapse in={curPage === txAdminMenuPage.Main} unmountOnExit mountOnEnter>
          <MainPageList />
        </Collapse>
      </Box>
      <PlayersPage visible={curPage === txAdminMenuPage.Players} />
      <IframePage visible={curPage === txAdminMenuPage.Iframe} />
    </>
  );
};

export default MenuRoot;
