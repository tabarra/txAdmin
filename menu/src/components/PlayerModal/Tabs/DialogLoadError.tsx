import React from "react";
import { Box, Typography } from "@mui/material";

export const DialogLoadError: React.FC = () => {
  return (
    <Box p={2} height="100%" display="flex" flexDirection="column">
        <Typography variant="h5" style={{ 
          alignSelf: "center", 
          marginTop: "auto",
          marginBottom: "auto",
          opacity: 0.5,
        }}>
          Failed to load player data :(
        </Typography>
      </Box>
  );
};
