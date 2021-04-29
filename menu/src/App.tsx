import React from "react";
import "./App.css";
import { useIsMenuVisible } from "./atoms/visibility.atom";
import MenuRoot from "./components/MenuRoot";
import { SnackbarProvider } from "./provider/SnackbarProvider";
import {DialogProvider} from "./provider/DialogProvider";
import {useEscapeListener} from "./hooks/useEscapeListener";

const App: React.FC = () => {
  const visible = useIsMenuVisible();
  useEscapeListener()

  return (
    <SnackbarProvider>
        <div className="App">
          <DialogProvider>
            {/*
              Fade API seems to not like this here
              will probably need to do a manual transition
            */}
            {visible && <MenuRoot />}
          </DialogProvider>
        </div>
    </SnackbarProvider>
  );
};

export default App;
