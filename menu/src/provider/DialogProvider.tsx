import React, {
  ChangeEvent,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
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
  useTheme,
} from "@material-ui/core";
import { Create } from "@material-ui/icons";
import { useKeyboardNavContext } from "./KeyboardNavProvider";
import {useSnackbar} from "notistack";

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
  const classes = useStyles();

  const theme = useTheme();

  const [dialogOpen, setDialogOpen] = useState(false);

  const [dialogProps, setDialogProps] = useState<InputDialogProps>({
    description: "This is the default description for whatever",
    placeholder: "This is the default placeholder...",
    onSubmit: () => {},
    title: "Dialog Title",
  });

  const { setDisabledKeyNav } = useKeyboardNavContext();

  const [dialogInputVal, setDialogInputVal] = useState<string>("");

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (dialogOpen) {
      setDisabledKeyNav(true);
    } else {
      setDisabledKeyNav(false);
    }
  }, [dialogOpen, setDisabledKeyNav]);

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleDialogSubmit = () => {
    if (!dialogInputVal.trim()) {
      enqueueSnackbar("You cannot have an empty input", { variant: 'error' });
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
      <Dialog
        onEscapeKeyDown={handleDialogClose}
        open={dialogOpen}
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: theme.palette.background.default,
          },
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleDialogSubmit();
          }}
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
            <Button
              onClick={handleDialogClose}
              style={{
                color: theme.palette.text.secondary,
              }}
            >
              Cancel
            </Button>
            <Button type="submit" color="primary">
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
