import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";
import { VisibilityProvider } from "./provider/VisibilityProvider";
import { MuiThemeProvider } from "@material-ui/core";
import { MenuTheme } from "./styles/theme";

ReactDOM.render(
  <VisibilityProvider>
    <MuiThemeProvider theme={MenuTheme}>
      <App />
    </MuiThemeProvider>
  </VisibilityProvider>,
  document.getElementById("root")
);
