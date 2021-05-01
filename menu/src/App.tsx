import React from "react";
import "./App.css";
import { useIsMenuVisible } from "./atoms/visibility.atom";
import MenuRoot from "./components/MenuRoot";
import { SnackbarProvider } from "./provider/SnackbarProvider";
import { DialogProvider } from "./provider/DialogProvider";
import { useEscapeListener } from "./hooks/useEscapeListener";
import { useNuiListenerService } from "./hooks/useNuiListenersService";
import { TopLevelErrorBoundary } from "./components/TopLevelErrorBoundary";
import {debugData} from "./utils/debugLog";

debugData([
  {
    action: 'setVisible',
    data: true
  }
])

const App: React.FC = () => {
  const visible = useIsMenuVisible();

  // These hooks don't ever unmount
  useEscapeListener();
  useNuiListenerService()

  return (
    <SnackbarProvider>
      <div className="App">
        <DialogProvider>
          <TopLevelErrorBoundary>
          {/*
              Fade API seems to not like this here
              will probably need to do a manual transition
            */}
          {visible && <MenuRoot />}
          </TopLevelErrorBoundary>
        </DialogProvider>
      </div>
    </SnackbarProvider>
);
};

export default App;
