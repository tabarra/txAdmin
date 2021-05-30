import { TextFieldProps, TextField as MuiTextField } from '@material-ui/core';
import React, { FocusEventHandler } from 'react';
import { useSetListenForExit } from '../../state/keys.state';

export const TextField: React.FC<TextFieldProps> = (props) => {
  const setListenForExit = useSetListenForExit()

  const handleOnFocusExit: FocusEventHandler<HTMLInputElement> = (e) => {
    // Forward if they exist on props

    setListenForExit(true)
  }

  const handleOnFocusEnter: FocusEventHandler<HTMLInputElement> = (e) => {
    // Forward if they exist on props
    setListenForExit(false)
  }

  return <MuiTextField onBlur={handleOnFocusExit} onFocus={handleOnFocusEnter} {...props} />
}