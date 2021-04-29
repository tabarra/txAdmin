import React, { ChangeEvent } from "react";
import { Box, makeStyles, Tab, Tabs, Theme } from "@material-ui/core";
import { usePageContext } from "../provider/PageProvider";

const useStyles = makeStyles((theme: Theme) => ({
  tab: {
    minWidth: '100px',
  }
}))

export const PageTabs: React.FC = () => {
  const classes = useStyles();
  const { page, setPage } = usePageContext();

  const handleChange = (event: ChangeEvent<{}>, newValue: number) => {
    setPage(newValue);
  };

  return (
      <Box width="100%">
      <Tabs
        value={page}
        centered
        indicatorColor="primary"
        textColor="secondary"
        onChange={handleChange}
      >
        <Tab className={classes.tab} label="Main" wrapped />
        <Tab className={classes.tab}label="Players" wrapped />
        <Tab className={classes.tab} label="TXAdmin" wrapped />
      </Tabs>
    </Box>
  );
};
