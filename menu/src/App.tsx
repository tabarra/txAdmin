import React, { useMemo } from "react";
import "./App.css";
import { useIsMenuVisible } from "./state/visibility.state";
import MenuRoot from "./components/MenuRoot";
import { DialogProvider } from "./provider/DialogProvider";
import { useExitListener } from "./hooks/useExitListener";
import { useNuiListenerService } from "./hooks/useNuiListenersService";
import { TopLevelErrorBoundary } from "./components/TopLevelErrorBoundary";
import { debugData } from "./utils/debugLog";
import { I18n } from "react-polyglot";
import { useServerCtxValue } from "./state/server.state";
import { getLocale } from "./utils/getLocale";
import { useHudListenersService } from "./hooks/useHudListenersService";

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
  useExitListener();
  useNuiListenerService();
  useHudListenersService()

  const localeSelected = useMemo(() => getLocale(serverCtx.locale), [serverCtx.locale]);

  return (
    <TopLevelErrorBoundary>
      <I18n
        locale={serverCtx.locale}
        messages={localeSelected}
        allowMissing={false}
      >
        <DialogProvider>
          <div className="App" style={visible ? { opacity: 1 } : undefined}>
            <MenuRoot />
          </div>
        </DialogProvider>
      </I18n>
    </TopLevelErrorBoundary>
  );
};

export default App;
