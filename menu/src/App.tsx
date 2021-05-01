import React from "react";
import "./App.css";
import { useIsMenuVisible } from "./state/visibility.state";
import MenuRoot from "./components/MenuRoot";
import { SnackbarProvider } from "./provider/SnackbarProvider";
import { DialogProvider } from "./provider/DialogProvider";
import { useEscapeListener } from "./hooks/useEscapeListener";
import { useNuiListenerService } from "./hooks/useNuiListenersService";
import { TopLevelErrorBoundary } from "./components/TopLevelErrorBoundary";
import { debugData } from "./utils/debugLog";

debugData([
  {
    action: "setVisible",
    data: true,
  },
]);

const App: React.FC = () => {
  const visible = useIsMenuVisible();

  // These hooks don't ever unmount
  useEscapeListener();
  useNuiListenerService();

  return (
    <SnackbarProvider>
        <DialogProvider>
          <TopLevelErrorBoundary>
          <div className="App" style={visible ? {opacity: 1} : undefined}>
            <MenuRoot />
          </div>
          </TopLevelErrorBoundary>
        </DialogProvider>
    </SnackbarProvider>
  );
};

export default App;
