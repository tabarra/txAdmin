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
        //NOTE: i removed the process.env.DEV_MODE from here because
        // it was erroring out on webpack 5, maybe try again?
        // if (process.env.DEV_MODE === 'browser') return;

        setVisible(false);
        fetchNui("closeMenu");
        fetchNui("playSound", "enter");
      }
    };

    window.addEventListener("keydown", keyHandler);

    return () => window.removeEventListener("keydown", keyHandler);
  }, [setVisible, shouldListen]);
};
