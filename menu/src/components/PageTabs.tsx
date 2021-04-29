import React, { ChangeEvent } from "react";
import { Box, Tab, Tabs } from "@material-ui/core";
import { usePageContext } from "../provider/PageProvider";

export const PageTabs: React.FC = () => {
  const { page, setPage } = usePageContext();

  const handleChange = (event: ChangeEvent<{}>, newValue: number) => {
    setPage(newValue);
  };

  return (
    <Box width="100%">
      <Tabs
        value={page}
        indicatorColor="primary"
        textColor="secondary"
        onChange={handleChange}
      >
        <Tab label="Main" wrapped />
        <Tab label="Players" wrapped />
        <Tab label="TXAdmin" wrapped />
      </Tabs>
    </Box>
  );
};
