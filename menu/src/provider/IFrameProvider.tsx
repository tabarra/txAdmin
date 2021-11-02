import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { txAdminMenuPage, usePage } from "../state/page.state";
import { useIsMenuVisibleValue } from "../state/visibility.state";
import { usePermissionsValue } from "../state/permissions.state";

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

export const BASE_IFRAME_PATH = "https://monitor/WebPipe";

export const useIFrameCtx = () => useContext<iFrameContextValue>(iFrameCtx);

// This allows for global control of the iFrame from other components
export const IFrameProvider: React.FC = ({ children }) => {
  const [curFramePg, setCurFramePg] = useState<ValidPath | null>(null);
  const [menuPage, setMenuPage] = usePage();
  const isMenuVisible = useIsMenuVisibleValue();

  // Will reset the iFrame page to server logs everytime
  useEffect(() => {
    if (isMenuVisible) {
      const refreshBuster = Math.random().toString().padStart(8, "0").slice(-8);
      setCurFramePg(`/nui/start?refresh${refreshBuster}`);
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

  const fullFrameSrc = useMemo(() => BASE_IFRAME_PATH + curFramePg, [
    curFramePg,
  ]);

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
