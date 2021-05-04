import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";
import { MuiThemeProvider } from "@material-ui/core";
import { MenuTheme } from "./styles/theme";
import { RecoilRoot } from "recoil";
import {KeyboardNavProvider} from "./provider/KeyboardNavProvider";

ReactDOM.render(
  <RecoilRoot>
    <MuiThemeProvider theme={MenuTheme}>
      <KeyboardNavProvider>
        <App />
      </KeyboardNavProvider>
    </MuiThemeProvider>
  </RecoilRoot>,
  document.getElementById("root")
);
