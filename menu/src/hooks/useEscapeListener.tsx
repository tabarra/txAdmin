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
      /**
       * TODO: Change to KeyboardEvent.code if fixed
       *
       * Probably shouldn't be using this as its language
       * dependent but KeyboardEvent.code is currently returning
       * an empty string in CEF
       */
      if (e.key === "Escape") {
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
