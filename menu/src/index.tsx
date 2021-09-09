import React from "react";
import ReactDOM from "react-dom";
import MenuWrapper from "./MenuWrapper";
import "./index.css";
import { ThemeProvider, Theme, StyledEngineProvider } from "@mui/material";
import { MenuTheme } from "./styles/theme";
import { RecoilRoot } from "recoil";
import { KeyboardNavProvider } from "./provider/KeyboardNavProvider";
import { SnackbarProvider } from "notistack";

ReactDOM.render(
  <RecoilRoot>
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={MenuTheme}>
        <KeyboardNavProvider>
          <SnackbarProvider
            maxSnack={3}
            style={{ pointerEvents: 'all',  margin: 0.5 * 8}}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            disableWindowBlurListener={true}
          >
            <React.Suspense fallback={<></>}>
              <MenuWrapper />
            </React.Suspense>
          </SnackbarProvider>
        </KeyboardNavProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  </RecoilRoot>,
  document.getElementById("root")
);
