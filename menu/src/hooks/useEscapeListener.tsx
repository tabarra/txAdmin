import { useEffect } from "react";
import { useSetIsMenuVisible } from "../atoms/visibility.atom";

/**
 * Attach a keyboard listener for escape, which will close the menu
 */
export const useEscapeListener = () => {
  const setVisible = useSetIsMenuVisible();

  useEffect(() => {
    const keyHandler = ({ code }) => {
      if (code === "Escape") {
        if (process.env.NODE_ENV !== "development") setVisible(false);
      }
    };

    window.addEventListener("keydown", keyHandler);

    return () => window.removeEventListener("keydown", keyHandler);
  }, [setVisible]);
};
