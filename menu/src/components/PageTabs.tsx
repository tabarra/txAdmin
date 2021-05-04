import React, {ChangeEvent, useCallback} from "react";
import {Box, makeStyles, Tab, Tabs} from "@material-ui/core";
import {txAdminMenuPage, usePage} from "../state/page.state";
import {useKeyboardNavigation} from "../hooks/useKeyboardNavigation";

const useStyles = makeStyles({
  tab: {
    minWidth: "100px",
  },
});

export const PageTabs: React.FC = () => {
  const classes = useStyles();
  const [page, setPage] = usePage();

  const handleChange = (event: ChangeEvent<{}>, newValue: number) => {
    setPage(newValue);
  };

  const handleArrowLeft = useCallback(() => {
    if (page > txAdminMenuPage.Main) setPage(page - 1)
  }, [page])

  const handleArrowRight = useCallback(() => {
    if (page < txAdminMenuPage.txAdmin) setPage(page + 1)
  }, [page])

  useKeyboardNavigation({
    onLeftDown: handleArrowLeft,
    onRightDown: handleArrowRight,
    disableOnFocused: true
  })

  return (
    <Box width="100%">
      <Tabs
        value={page}
        centered
        indicatorColor="primary"
        textColor="secondary"
        onChange={handleChange}
      >
        <Tab className={classes.tab} label="Main" wrapped disableFocusRipple/>
        <Tab className={classes.tab}label="Players" wrapped disableFocusRipple/>
        <Tab className={classes.tab} label="TXAdmin" wrapped disableFocusRipple/>
      </Tabs>
    </Box>
  );
};
