import React from "react";
import "./App.css";
import { useVisibleContext } from "./provider/VisibilityProvider";
import { Fade } from "@material-ui/core";
import MenuRoot from "./components/MenuRoot";
import { SnackbarProvider } from "./provider/SnackbarProvider";
import { PageProvider } from "./provider/PageProvider";
import {DialogProvider} from "./provider/DialogProvider";

const App: React.FC = () => {
  const { visibility } = useVisibleContext();

  return (
    <SnackbarProvider>
      <PageProvider>
        <div className="App">
          <DialogProvider>
            <Fade in={visibility}>
              <MenuRoot />
            </Fade>
          </DialogProvider>
        </div>
      </PageProvider>
    </SnackbarProvider>
  );
};

export default App;
