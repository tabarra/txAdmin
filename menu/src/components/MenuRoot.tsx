import React from 'react';
import { Box, makeStyles } from "@material-ui/core";

const useStyles = makeStyles({
  root: {
    background: "black",
    width: 200,
    height: 400
  }
})

const MenuRoot: React.FC = ({}) => {

  const classes = useStyles()

  return (
    <Box p={2} className={classes.root}>
      <img src='/txadmin.png' alt='txadmin bro'/>
    </Box>
  );
};

export default MenuRoot;
