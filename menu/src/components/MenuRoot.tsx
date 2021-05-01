import React from "react";
import { Box, makeStyles, Theme } from "@material-ui/core";
import { PageTabs } from "./PageTabs";
import { MainPageList } from "./MainPageList";
import { PlayersPage } from "./PlayersPage";

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

  return (
   <>
      <Box p={2} className={classes.root}>
        <TxAdminLogo />
        <PageTabs />
        <MainPageList />
      </Box>
      <PlayersPage />
   </>
  );
};

export default MenuRoot;
