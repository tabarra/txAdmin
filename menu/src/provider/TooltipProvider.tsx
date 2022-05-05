import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { txAdminMenuPage, usePageValue } from "../state/page.state";
import { useIsMenuVisibleValue } from "../state/visibility.state";
import { useDialogContext } from "./DialogProvider";

interface TooltipContextValue {
  setTooltipText: (text: string) => void;
  tooltipText: string;
  setTooltipOpen: (open: boolean) => void;
  tooltipOpen: boolean;
}

const TooltipCtx = createContext(null);

export const useTooltip = () => useContext<TooltipContextValue>(TooltipCtx);

const HIDE_TOOLTIP_AFTER_MS = 7000;

export const TooltipProvider: React.FC = ({ children }) => {
  const [tooltipText, _setTooltipText] = useState("");
  const [_tooltipOpen, setTooltipOpen] = useState(false);
  const isMenuVisible = useIsMenuVisibleValue();
  const curPage = usePageValue();
  const { isDialogOpen } = useDialogContext();
  const hideTooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const firstDisplayFinished = useRef(false);

  // Make sure we hide tooltip with these conditions
  const tooltipOpen = useMemo(() => {
    if (tooltipText === "") return false;
    if (isDialogOpen) return false;
    if (!isMenuVisible) return false;
    if (curPage !== txAdminMenuPage.Main) return false;

    return _tooltipOpen;
  }, [tooltipText, isDialogOpen, isMenuVisible, curPage, _tooltipOpen]);

  useLayoutEffect(() => {
    if (curPage !== txAdminMenuPage.Main) {
      firstDisplayFinished.current = false;
      return setTooltipOpen(false);
    }

    const pageTimeout = setTimeout(() => {
      setTooltipOpen(true);
      firstDisplayFinished.current = true;
    }, 2000);

    return () => {
      clearTimeout(pageTimeout);
    };
  }, [curPage]);

  const setTooltipText = useCallback(
    (text: string) => {
      _setTooltipText(text);

      if (firstDisplayFinished.current) {
        setTooltipOpen(true);
      }

      if (hideTooltipTimerRef.current) {
        clearTimeout(hideTooltipTimerRef.current);
      }

      hideTooltipTimerRef.current = setTimeout(() => {
        setTooltipOpen(false);
        hideTooltipTimerRef.current = null;
      }, HIDE_TOOLTIP_AFTER_MS);
    },
    [tooltipOpen]
  );

  useEffect(() => {
    return () => {
      if (hideTooltipTimerRef.current)
        clearTimeout(hideTooltipTimerRef.current);
    };
  }, []);

  return (
    <TooltipCtx.Provider
      value={{ tooltipText, setTooltipText, setTooltipOpen, tooltipOpen }}
    >
      {children}
    </TooltipCtx.Provider>
  );
};
