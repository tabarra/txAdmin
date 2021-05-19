import React from "react";
import { Box, DialogContent, Typography, useTheme } from "@material-ui/core";
import { useStyles } from "../modal.styles";

const DialogIdView: React.FC = () => {
  const theme = useTheme();
  const classes = useStyles();

  return (
    <DialogContent>
      <Typography variant="h6" style={{ paddingBottom: 5 }}>Player Identifiers</Typography>
      <Box className={classes.codeBlock}>
        <Typography className={classes.codeBlockText}><strong>steam:</strong><span
          style={{ color: theme.palette.text.secondary }}>32423422424424</span></Typography>
      </Box>
      <Box className={classes.codeBlock}>
        <Typography className={classes.codeBlockText}><strong>license:</strong><span
          style={{ color: theme.palette.text.secondary }}>32423422424424</span></Typography>
      </Box>
      <Box className={classes.codeBlock}>
        <Typography className={classes.codeBlockText}><strong>discord:</strong><span
          style={{ color: theme.palette.text.secondary }}>32423422424424</span></Typography>
      </Box>
      <Box className={classes.codeBlock}>
        <Typography className={classes.codeBlockText}><strong>xbl:</strong><span
          style={{ color: theme.palette.text.secondary }}>32423422424424</span></Typography>
      </Box>
      <Box className={classes.codeBlock}>
        <Typography className={classes.codeBlockText}><strong>fivem:</strong><span
          style={{ color: theme.palette.text.secondary }}>32423422424424</span></Typography>
      </Box>
    </DialogContent>
  )
}

export default DialogIdView;