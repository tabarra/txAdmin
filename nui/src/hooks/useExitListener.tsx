import { useEffect } from "react";
import { fetchNui } from "../utils/fetchNui";
import { useSetIsMenuVisible } from "../state/visibility.state";
import { useListenForExitValue } from "../state/keys.state";

/**
 * Attach a keyboard listener for escape & backspace, which will close the menu
 *
 */
export const useExitListener = () => {
  const setVisible = useSetIsMenuVisible();

  const shouldListen = useListenForExitValue();

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (!shouldListen) return;
      if (["Escape", "Backspace"].includes(e.code)) {
        setVisible(false);
        fetchNui("closeMenu");
        fetchNui("playSound", "enter");
      }
    };

    window.addEventListener("keydown", keyHandler);

    return () => window.removeEventListener("keydown", keyHandler);
  }, [setVisible, shouldListen]);
};
