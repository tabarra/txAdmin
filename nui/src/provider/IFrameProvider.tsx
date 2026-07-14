import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { txAdminMenuPage, usePage } from "../state/page.state";
import { useIsMenuVisibleValue } from "../state/visibility.state";
import { NUI_WEBPIPE_URL } from "../utils/constants";

const iFrameCtx = createContext(null);

type ValidPath = `/${string}`;

interface iFrameContextValue {
  goToFramePage: (path: ValidPath) => void;
  setFramePage: (path: ValidPath) => void;
  currentFramePg: string;
  fullFrameSrc: string;
  handleChildPost: (data: IFramePostData) => string;
}

export interface IFramePostData {
  action: string;
  data: unknown;
  __isFromChild: true;
}

// export const BASE_IFRAME_PATH = "https://cfx-nui-monitor/WebPipe"; //!NC:RESNAME:CFX
// export const BASE_IFRAME_PATH = "https://monitor/WebPipe"; //!NC:RESNAME:FIXME:gen8
// export const BASE_IFRAME_PATH = "https://cfx-nui-txadmin/WebPipe"; //!NC:RESNAME:CFX - FIXME:DOESNT:WORK
// export const BASE_IFRAME_PATH = "https://txadmin/WebPipe"; //!NC:RESNAME DONE:WORKS

//!NC:DEBUG:RESNAME
console.log('nui:IFrameProvider', {
  target: NUI_WEBPIPE_URL,
  origin: window.location.origin,
  ancestors: [...window.location.ancestorOrigins].join(', '),
});

export const useIFrameCtx = () => useContext<iFrameContextValue>(iFrameCtx);

interface IFrameProviderProps {
  children: ReactNode;
}

// This allows for global control of the iFrame from other components
export const IFrameProvider: React.FC<IFrameProviderProps> = ({ children }) => {
  const [curFramePg, setCurFramePg] = useState<ValidPath | null>(null);
  const [menuPage, setMenuPage] = usePage();
  const isMenuVisible = useIsMenuVisibleValue();

  // Will reset the iFrame page to server logs everytime
  useEffect(() => {
    if (isMenuVisible) {
      const refreshBuster = Math.random().toString().padStart(8, "0").slice(-8);
      setCurFramePg(`/server/server-log?refresh${refreshBuster}`);
    }
  }, [isMenuVisible]);

  // Call if you need to both navigate to iFrame page & set the iFrame path
  const goToFramePage = useCallback(
    (path: ValidPath) => {
      if (menuPage !== txAdminMenuPage.IFrame) {
        setMenuPage(txAdminMenuPage.IFrame);
      }

      setCurFramePg(path);
    },
    [menuPage]
  );

  // Call if you only need to set the iFrame path for background use, and
  // do not require for the menu to change page
  const setFramePage = useCallback((path: ValidPath) => {
    setCurFramePg(path);
  }, []);

  const handleChildPost = useCallback((data: IFramePostData) => {
    // Probably should have a reducer here or smth, for now lets just log the data
    console.log("Data received from child:", data);
  }, []);

  const fullFrameSrc = useMemo(
    () => NUI_WEBPIPE_URL + curFramePg,
    [curFramePg]
  );

  return (
    <iFrameCtx.Provider
      value={{
        goToFramePage,
        currentFramePath: curFramePg,
        setFramePage,
        fullFrameSrc,
        handleChildPost,
      }}
    >
      {children}
    </iFrameCtx.Provider>
  );
};
