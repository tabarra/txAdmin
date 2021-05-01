import React, { ChangeEvent, createContext, useContext, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  makeStyles,
  TextField,
  Theme,
} from "@material-ui/core";
import { Create } from "@material-ui/icons";
import { useSnackbarContext } from "./SnackbarProvider";

interface InputDialogProps {
  title: string;
  description: string;
  placeholder: string;
  onSubmit: (inputValue: string) => void;
}

interface DialogProviderContext {
  openDialog: (dialogProps: InputDialogProps) => void;
  closeDialog: () => void;
}

const DialogContext = createContext(null);

const useStyles = makeStyles((theme: Theme) => ({
  icon: {
    color: theme.palette.text.secondary,
  },
  dialogTitleOverride: {
    color: theme.palette.primary.main,
  },
}));

export const DialogProvider: React.FC = ({ children }) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const [dialogProps, setDialogProps] = useState<InputDialogProps>({
    description: "This is the default description for whatever",
    placeholder: "This is the default placeholder...",
    onSubmit: () => {},
    title: "Dialog Title",
  });

  const [dialogInputVal, setDialogInputVal] = useState<string>("");

  const { openSnackbar } = useSnackbarContext();

  const classes = useStyles();

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleDialogSubmit = () => {
    if (!dialogInputVal.trim()) {
      openSnackbar("error", "You cannot have an empty input");
      return;
    }

    dialogProps.onSubmit(dialogInputVal);
    setDialogOpen(false);
    setDialogInputVal("");
  };

  const openDialog = (dialogProps: InputDialogProps) => {
    setDialogProps(dialogProps);
    setDialogOpen(true);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDialogInputVal(e.target.value);
  };

  return (
    <DialogContext.Provider
      value={{
        openDialog,
        closeDialog: handleDialogClose,
      }}
    >
      <Dialog open={dialogOpen} fullWidth>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleDialogSubmit();
          }}
          action="/"
        >
          <DialogTitle classes={{ root: classes.dialogTitleOverride }}>
            {dialogProps.title}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>{dialogProps.description}</DialogContentText>
            <TextField
              variant="standard"
              autoFocus
              fullWidth
              id="dialog-input"
              placeholder={dialogProps.placeholder}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Create className={classes.icon} color="inherit" />
                  </InputAdornment>
                ),
              }}
              onChange={handleChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button onClick={handleDialogSubmit} color="primary">
              Submit
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {children}
    </DialogContext.Provider>
  );
};

export const useDialogContext = () =>
  useContext<DialogProviderContext>(DialogContext);
