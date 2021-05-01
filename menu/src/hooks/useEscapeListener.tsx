import { useEffect } from "react";
import { useSetIsMenuVisible } from "../atoms/visibility.atom";
import {fetchNui} from "../utils/fetchNui";

/**
 * Attach a keyboard listener for escape, which will close the menu
 */
export const useEscapeListener = () => {
  const setVisible = useSetIsMenuVisible();

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        if (process.env.NODE_ENV !== "development") {
          setVisible(false)
          fetchNui('closeMenu')
        }
      }
    };

    window.addEventListener("keydown", keyHandler);

    return () => window.removeEventListener("keydown", keyHandler);
  }, [setVisible]);
};
