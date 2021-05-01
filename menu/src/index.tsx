import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";
import { MuiThemeProvider } from "@material-ui/core";
import { MenuTheme } from "./styles/theme";
import { RecoilRoot } from "recoil";

ReactDOM.render(
  <RecoilRoot>
    <MuiThemeProvider theme={MenuTheme}>
      <App />
    </MuiThemeProvider>
  </RecoilRoot>,
  document.getElementById("root")
);
