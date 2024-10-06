import React, { useEffect } from "react";
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
import { WarnPage } from "./components/WarnPage/WarnPage";
import { IFrameProvider } from "./provider/IFrameProvider";
import { PlayerModalProvider } from "./provider/PlayerModalProvider";
import { txAdminMenuPage, useSetPage } from "./state/page.state";
import { useListenerForSomething } from "./hooks/useListenerForSomething";
import {
  usePlayersFilterIsTemp,
  useSetPlayerFilter,
} from "./state/players.state";
import { Box } from "@mui/material";
import { fetchNui } from "./utils/fetchNui";
import { useLocale } from "./hooks/useLocale";
import { TooltipProvider } from "./provider/TooltipProvider";

//Mock events for browser development
debugData<any>(
  [
    {
      action: "setPermissions",
      data: ["all_permissions"],
      // data: ['players.heal', 'announcement'],
      // data: [],
    },
    {
      action: "setVisible",
      data: true,
    },
    {
      action: "setGameName",
      data: 'fivem',
      // data: 'redm',
    },
  ],
  150
);

const MenuWrapper: React.FC = () => {
  const visible = useIsMenuVisibleValue();
  const serverCtx = useServerCtxValue();
  const [playersFilterIsTemp, setPlayersFilterIsTemp] =
    usePlayersFilterIsTemp();
  const setPlayerFilter = useSetPlayerFilter();

  const setPage = useSetPage();
  // These hooks don't ever unmount
  useExitListener();
  useNuiListenerService();

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

  const localeSelected = useLocale();
  //Inform Lua that we are ready to get all variables (server ctx, permissions, debug, etc)
  useEffect(() => {
    fetchNui("reactLoaded").catch(() => { });
  }, []);

  useListenerForSomething();

  return (
    <TopLevelErrorBoundary>
      <I18n
        locale={serverCtx.locale}
        messages={localeSelected}
        allowMissing={false}
      >
        <>
          <IFrameProvider>
            <DialogProvider>
              <PlayerModalProvider>
                <TooltipProvider>
                  <Box
                    id="menu-root"
                    className="App"
                    sx={{
                      opacity: visible ? 1 : 0,
                    }}
                  >
                    <MenuRoot />
                  </Box>
                </TooltipProvider>
              </PlayerModalProvider>
            </DialogProvider>
          </IFrameProvider>
          <WarnPage />
        </>
      </I18n>
    </TopLevelErrorBoundary>
  );
};

export default MenuWrapper;
