import { TextFieldProps, TextField as MuiTextField } from "@mui/material";
import React, { FocusEventHandler } from "react";
import { useSetListenForExit } from "../../state/keys.state";

export const TextField: React.FC<TextFieldProps> = (props) => {
  const setListenForExit = useSetListenForExit();

  const handleOnFocusExit: FocusEventHandler<HTMLInputElement> = () => {
    // Forward if they exist on props
    setListenForExit(true);
  };

  const handleOnFocusEnter: FocusEventHandler<HTMLInputElement> = () => {
    // Forward if they exist on props
    setListenForExit(false);
  };

  return (
    <MuiTextField
      variant={props?.variant ?? 'standard'}
      onBlur={handleOnFocusExit}
      onFocus={handleOnFocusEnter}
      {...props}
    />
  );
};
