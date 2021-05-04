import React, { useMemo } from "react";
import "./App.css";
import { useIsMenuVisible } from "./state/visibility.state";
import MenuRoot from "./components/MenuRoot";
import { SnackbarProvider } from "./provider/SnackbarProvider";
import { DialogProvider } from "./provider/DialogProvider";
import { useEscapeListener } from "./hooks/useEscapeListener";
import { useNuiListenerService } from "./hooks/useNuiListenersService";
import { TopLevelErrorBoundary } from "./components/TopLevelErrorBoundary";
import { debugData } from "./utils/debugLog";
import { I18n } from "react-polyglot";
import { useServerCtxValue } from "./state/server.state";
import { getLocale } from "./utils/getLocale";

debugData([
  {
    action: "setVisible",
    data: true,
  },
]);

const App: React.FC = () => {
  const visible = useIsMenuVisible();
  const serverCtx = useServerCtxValue();
  // These hooks don't ever unmount
  useEscapeListener();
  useNuiListenerService();

  const localeSelected = useMemo(() => getLocale(serverCtx.locale), [serverCtx.locale]);

  return (
    <TopLevelErrorBoundary>
      <I18n locale={serverCtx.locale} messages={localeSelected}>
        <SnackbarProvider>
          <DialogProvider>
            <div className="App" style={visible ? { opacity: 1 } : undefined}>
              <MenuRoot />
            </div>
          </DialogProvider>
        </SnackbarProvider>
      </I18n>
    </TopLevelErrorBoundary>
  );
};

export default App;
