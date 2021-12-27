import React, {
  ChangeEvent,
  createContext,
  ReactEventHandler,
  useCallback,
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
  TextField,
  Theme,
  useTheme,
} from "@mui/material";
import makeStyles from '@mui/styles/makeStyles';
import { Create } from "@mui/icons-material";
import { useKeyboardNavContext } from "./KeyboardNavProvider";
import { useSnackbar } from "notistack";
import { useTranslate } from "react-polyglot";
import { useSetDisableTab, useSetListenForExit } from "../state/keys.state";
import { txAdminMenuPage, usePageValue } from "../state/page.state";

interface InputDialogProps {
  title: string;
  description: string;
  placeholder: string;
  onSubmit: (inputValue: string) => void;
  isMultiline?: boolean;
}

interface DialogProviderContext {
  openDialog: (dialogProps: InputDialogProps) => void;
  closeDialog: () => void;
  isDialogOpen: boolean;
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

const defaultDialogState = {
  description: "This is the default description for whatever",
  placeholder: "This is the default placeholder...",
  onSubmit: () => {},
  title: "Dialog Title",
};

export const DialogProvider: React.FC = ({ children }) => {
  const classes = useStyles();
  const theme = useTheme();
  const [canSubmit, setCanSubmit] = useState(true)

  const setDisableTabs = useSetDisableTab();
  const { setDisabledKeyNav } = useKeyboardNavContext();
  const setListenForExit = useSetListenForExit();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProps, setDialogProps] = useState<InputDialogProps>(
    defaultDialogState
  );
  const [dialogInputVal, setDialogInputVal] = useState<string>("");
  const { enqueueSnackbar } = useSnackbar();
  const curPage = usePageValue();
  const t = useTranslate();

  useEffect(() => {
    if (curPage === txAdminMenuPage.Main) {
      setDisabledKeyNav(dialogOpen);
      setDisableTabs(dialogOpen);
    }
  }, [dialogOpen, setDisabledKeyNav, setDisableTabs]);

  const handleDialogSubmit = () => {
    if (!dialogInputVal.trim()) {
      return enqueueSnackbar(t("nui_menu.misc.dialog_empty_input"), {
        variant: "error",
      });
    }

    if (!canSubmit) return

    dialogProps.onSubmit(dialogInputVal);

    setCanSubmit(false)

    setListenForExit(true);
    setDialogOpen(false);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDialogInputVal(e.target.value);
  };

  const openDialog = useCallback((dialogProps: InputDialogProps) => {
    setDialogProps(dialogProps);
    setDialogOpen(true);
    setListenForExit(false);
  }, []);

  const handleDialogClose: ReactEventHandler<{}> = useCallback((e) => {
    e.stopPropagation();
    setDialogOpen(false);
    setListenForExit(true);
  }, []);

  // We reset default state after the animation is complete
  const handleOnExited = () => {
    setDialogProps(defaultDialogState);
    setCanSubmit(true)
    setDialogInputVal('')
  };

  return (
    <DialogContext.Provider
      value={{
        openDialog,
        closeDialog: handleDialogClose,
        isDialogOpen: dialogOpen,
      }}
    >
      <Dialog
        onClose={handleDialogClose}
        open={dialogOpen}
        fullWidth
        TransitionProps={{
          onExited: handleOnExited
        }}
        PaperProps={{
          style: {
            backgroundColor: theme.palette.background.default,
          },
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleDialogSubmit();
          }}
        >
          <DialogTitle classes={{ root: classes.dialogTitleOverride }}>
            {dialogProps.title}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>{dialogProps.description}</DialogContentText>
            <TextField
              sx={{pt: 1}}
              variant="standard"
              autoFocus
              fullWidth
              multiline={dialogProps?.isMultiline}
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
              {t("nui_menu.common.cancel")}
            </Button>
            <Button type="submit" color="primary">
              {t("nui_menu.common.submit")}
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
