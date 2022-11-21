import { ButtonProps, Button } from "@mui/material";
import React from "react";

export const ButtonXS: React.FC<ButtonProps> = (props) => {
  return (
    <Button
      size="small"
      style={{
        padding: '2px 6px 0px 6px',
        fontSize: '0.70rem',
        letterSpacing: '0.03333em',
        marginTop: '-2px',
      }}
      {...props}
    >
      {props.children}
    </Button>
  );
};
