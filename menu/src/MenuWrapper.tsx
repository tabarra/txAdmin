import React, { useEffect, useMemo } from "react";
import "./App.css";
import { useIsMenuVisibleValue } from "./state/visibility.state";
import MenuRoot from "./components/MenuRoot";
import { DialogProvider } from "./provider/DialogProvider";
import { useExitListener } from "./hooks/useExitListener";
import { useNuiListenerService } from "./hooks/useNuiListenersService";
import { TopLevelErrorBoundary } from "./components/misc/TopLevelErrorBoundary";
import { debugData } from "./utils/debugData";
import { I18n } from "react-polyglot";
import { useServerCtxValue } from "./state/server.state";
import { getLocale } from "./utils/getLocale";
import { WarnPage } from "./components/WarnPage/WarnPage";
import { IFrameProvider } from "./provider/IFrameProvider";
import { useCheckCredentials } from "./hooks/useCheckCredentials";
import { PlayerModalProvider } from "./provider/PlayerModalProvider";
import { txAdminMenuPage, useSetPage } from "./state/page.state";
import { useListenerForSomething } from "./hooks/useListenerForSomething";
import { usePlayersFilterIsTemp, useSetPlayerFilter } from "./state/players.state";

debugData(
  [
    {
      action: "setVisible",
      data: true,
    },
  ],
  3000
);

const MenuWrapper: React.FC = () => {
  const visible = useIsMenuVisibleValue();
  const serverCtx = useServerCtxValue();
  const [playersFilterIsTemp, setPlayersFilterIsTemp] = usePlayersFilterIsTemp();
  const setPlayerFilter = useSetPlayerFilter();

  const setPage = useSetPage();
  // These hooks don't ever unmount
  useExitListener();
  useNuiListenerService();
  useCheckCredentials();

  //Change page back to Main when closed
  useEffect(() => {
    if (visible) return;

    const changeTimer = setTimeout(() => {
      setPage(txAdminMenuPage.Main);
    }, 750);

    if (playersFilterIsTemp) {
      setPlayerFilter("");
      setPlayersFilterIsTemp(false);
    }

    return () => clearInterval(changeTimer);
  }, [visible, playersFilterIsTemp]);

  const localeSelected = useMemo(() => getLocale(serverCtx.locale), [
    serverCtx.locale,
  ]);

  useListenerForSomething();

  const styled = visible ? { opacity: 1 } : undefined;

  return (
    <TopLevelErrorBoundary>
      <I18n
        locale={serverCtx.locale}
        messages={localeSelected}
        allowMissing={false}
      >
        <IFrameProvider>
          <DialogProvider>
            <PlayerModalProvider>
              <div className="App" style={styled}>
                <MenuRoot />
              </div>
            </PlayerModalProvider>
          </DialogProvider>
          <WarnPage />
        </IFrameProvider>
      </I18n>
    </TopLevelErrorBoundary>
  );
};

export default MenuWrapper;
