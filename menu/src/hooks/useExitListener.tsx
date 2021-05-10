import { useEffect } from "react";
import { fetchNui } from "../utils/fetchNui";
import { useSetIsMenuVisible } from "../state/visibility.state";
import { useKeyboardNavContext } from "../provider/KeyboardNavProvider";

/**
 * Attach a keyboard listener for escape, which will close the menu
 */
export const useExitListener = () => {
  const setVisible = useSetIsMenuVisible();

  const { disabledKeyNav } = useKeyboardNavContext()

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (disabledKeyNav) return
      if (["Escape", "Backspace"].includes(e.code)) {

        if (!process.env.DEV_IN_GAME && process.env.NODE_ENV === "development") return

        setVisible(false);
        fetchNui("closeMenu");
      }
    };

    window.addEventListener("keydown", keyHandler);

    return () => window.removeEventListener("keydown", keyHandler);
  }, [setVisible, disabledKeyNav]);
};
