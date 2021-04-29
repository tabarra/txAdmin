import React from "react";
import "./App.css";
import { useVisibleContext } from "./provider/VisibilityProvider";
import { Fade } from "@material-ui/core";
import MenuRoot from "./components/MenuRoot";
import { SnackbarProvider } from "./provider/SnackbarProvider";
import { PageProvider } from "./provider/PageProvider";

const App: React.FC = () => {
  const { visibility } = useVisibleContext();

  return (
    <SnackbarProvider>
      <PageProvider>
        <div className="App">
          <Fade in={visibility}>
            <MenuRoot />
          </Fade>
        </div>
      </PageProvider>
    </SnackbarProvider>
  );
};

export default App;
