import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";
import { MuiThemeProvider } from "@material-ui/core";
import { MenuTheme } from "./styles/theme";
import { RecoilRoot } from "recoil";
import {KeyboardNavProvider} from "./provider/KeyboardNavProvider";
import {SnackbarProvider} from "notistack";
import {I18n} from "react-polyglot";

ReactDOM.render(
  <RecoilRoot>
    <MuiThemeProvider theme={MenuTheme}>
      <KeyboardNavProvider>
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          disableWindowBlurListener={true}
        >
          <App />
        </SnackbarProvider>
      </KeyboardNavProvider>
    </MuiThemeProvider>
  </RecoilRoot>,
  document.getElementById("root")
);
