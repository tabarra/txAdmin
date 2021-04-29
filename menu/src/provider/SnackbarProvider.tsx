import React, { createContext, useState } from "react";
import { Snackbar } from "@material-ui/core";
import { Alert } from "@material-ui/lab";

const SnackbarContext = createContext({});

type SnackbarAlertSeverities = "success" | "error" | "warning" | "info";

interface SnackbarAlert {
  level: SnackbarAlertSeverities;
  message: string;
}

export const SnackbarProvider: React.FC = ({ children }) => {
  const [alert, setAlert] = useState<SnackbarAlert>({
    level: "info",
    message: "",
  });
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const openSnackbar = (level: SnackbarAlertSeverities, message: string) => {
    setAlert({ level, message });
    setIsOpen(true);
  };

  const closeSnackbar = () => {
    setIsOpen(false);
    setAlert({ level: "info", message: "" });
  };

  const handleClose = () => {
    setIsOpen(false);
    setAlert({ level: "info", message: "" });
  };

  return (
    <SnackbarContext.Provider
      value={{
        openSnackbar,
        closeSnackbar,
      }}
    >
      <Snackbar open={isOpen} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={alert.level}>
          {alert.message}
        </Alert>
      </Snackbar>
      {children}
    </SnackbarContext.Provider>
  );
};
