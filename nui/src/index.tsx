import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import MenuWrapper from "./MenuWrapper";
import "./index.css";
import { ThemeProvider, StyledEngineProvider } from "@mui/material";
import { MenuTheme } from "./styles/theme";
import { MenuThemeRedm } from "./styles/theme-redm";
import { RecoilRoot } from "recoil";
import { KeyboardNavProvider } from "./provider/KeyboardNavProvider";
import { SnackbarProvider } from "notistack";
import { registerDebugFunctions } from "./utils/registerDebugFunctions";
import { useNuiEvent } from "./hooks/useNuiEvent";

registerDebugFunctions();

const rootContainer = document.getElementById("root");
const root = createRoot(rootContainer);

const App = () => {
  const [isRedmTheme, setIsRedmTheme] = useState(false);

  useNuiEvent<string>("setGameName", (gameName: string) => {
    setIsRedmTheme(gameName === 'redm')
  });

  //FIXME: finish writing the new theme and remove this snippet
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setIsRedmTheme(currState => !currState);
  //   }, 1000);

  //   return () => {
  //     clearTimeout(timer);
  //   };
  // }, []);

  return (
    <RecoilRoot>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={isRedmTheme ? MenuThemeRedm : MenuTheme}>
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
};

root.render(<App />);
