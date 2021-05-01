import React from "react";
import { Box, makeStyles, Theme } from "@material-ui/core";
import { PageTabs } from "./PageTabs";
import { MainPageList } from "./MainPageList";
import { PlayersPage } from "./PlayersPage";
import { txAdminMenuPage, usePageValue } from "../state/page.state";

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

  const curPage = usePageValue();

  return (
   <>
      <Box p={2} className={classes.root}>
        <TxAdminLogo />
        <PageTabs />
        <MainPageList visible={curPage === txAdminMenuPage.Main} />
      </Box>
      <PlayersPage visible={curPage === txAdminMenuPage.Players} />
    </>
  );
};

export default MenuRoot;
