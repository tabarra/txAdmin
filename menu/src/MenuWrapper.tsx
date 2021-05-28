import React, { useMemo } from "react";
import "./App.css";
import { useIsMenuVisible } from "./state/visibility.state";
import MenuRoot from "./components/MenuRoot";
import { DialogProvider } from "./provider/DialogProvider";
import { useExitListener } from "./hooks/useExitListener";
import { useNuiListenerService } from "./hooks/useNuiListenersService";
import { TopLevelErrorBoundary } from "./components/misc/TopLevelErrorBoundary";
import { debugData } from "./utils/debugLog";
import { I18n } from "react-polyglot";
import { useServerCtxValue } from "./state/server.state";
import { getLocale } from "./utils/getLocale";
import { WarnPage } from "./components/WarnPage/WarnPage";
import { IFrameProvider } from "./provider/IFrameProvider";
import { usesCheckCredentials } from './hooks/useCheckCredentials';

debugData([
  {
    action: "setVisible",
    data: true,
  },
]);

const MenuWrapper: React.FC = () => {
  const visible = useIsMenuVisible();
  const serverCtx = useServerCtxValue();
  // These hooks don't ever unmount
  useExitListener();
  useNuiListenerService();
  usesCheckCredentials();

  const localeSelected = useMemo(() => getLocale(serverCtx.locale), [
    serverCtx.locale,
  ]);

  return (
    <TopLevelErrorBoundary>
      <I18n
        locale={serverCtx.locale}
        messages={localeSelected}
        allowMissing={false}
      >
        <IFrameProvider>
          <DialogProvider>
            <div className="App" style={visible ? { opacity: 1 } : undefined}>
              <MenuRoot />
            </div>
          </DialogProvider>
          <WarnPage />
        </IFrameProvider>
      </I18n>
    </TopLevelErrorBoundary>
  );
};

export default MenuWrapper;
