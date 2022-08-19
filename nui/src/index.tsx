import React from "react";
import { createRoot } from "react-dom/client";
import MenuWrapper from "./MenuWrapper";
import "./index.css";
import { ThemeProvider, StyledEngineProvider, Theme } from "@mui/material";
import { MenuTheme } from "./styles/theme";
import { RecoilRoot } from "recoil";
import { KeyboardNavProvider } from "./provider/KeyboardNavProvider";
import { SnackbarProvider } from "notistack";
import { registerDebugFunctions } from "./utils/registerDebugFunctions";

registerDebugFunctions();

const rootContainer = document.getElementById("root");
const root = createRoot(rootContainer);

root.render(
  <RecoilRoot>
    <StyledEngineProvider injectFirst>
      <ThemeProvider<Theme> theme={MenuTheme}>
        <KeyboardNavProvider>
          <SnackbarProvider
            maxSnack={5}
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
  </RecoilRoot>
);
