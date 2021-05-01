import { useEffect } from "react";
import { fetchNui } from "../utils/fetchNui";
import { useSetIsMenuVisible } from "../state/visibility.state";

/**
 * Attach a keyboard listener for escape, which will close the menu
 */
export const useEscapeListener = () => {
  const setVisible = useSetIsMenuVisible();

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (["Escape", "F1"].includes(e.code)) {
        if (process.env.NODE_ENV !== "development") {
          setVisible(false);
          fetchNui("closeMenu");
        }
      }
    };

    window.addEventListener("keydown", keyHandler);

    return () => window.removeEventListener("keydown", keyHandler);
  }, [setVisible]);
};
