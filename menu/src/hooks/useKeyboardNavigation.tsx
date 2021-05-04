import { useEffect } from "react";
import { useKeyboardNavContext } from "../provider/KeyboardNavProvider";

interface KeyCallbacks {
  onLeftDown?: () => void;
  onRightDown?: () => void;
  onUpDown?: () => void;
  onDownDown?: () => void;
  onEnterDown?: () => void;
}

/**
 * A simple hook for listening to arrow key down events + enter
 *
 * Note: Might change this up a little bit so its more of a global event listener
 *
 * @param onLeftDown - Left arrow handler function
 * @param onRightDown - Right arrow handler function
 * @param onUpDown - Up arrow handler function
 * @param onDownDown - Down arrow handler function
 * @param onEnterDown - Enter handler function
 */

export const useKeyboardNavigation = ({
  onLeftDown,
  onRightDown,
  onUpDown,
  onDownDown,
  onEnterDown,
}: KeyCallbacks) => {
  const { disabledKeyNav } = useKeyboardNavContext();

  useEffect(() => {
    // Our basic handler function for keydown events
    const keyHandler = (e: KeyboardEvent) => {

      switch (e.code) {
        case "ArrowLeft":
          onLeftDown && onLeftDown();
          break;
        case "ArrowRight":
          onRightDown && onRightDown();
          break;
        case "ArrowUp":
          onUpDown && onUpDown();
          break;
        case "ArrowDown":
          onDownDown && onDownDown();
          break;
        case "Enter":
          onEnterDown && onEnterDown();
          break;
      }
    };

    // Add that boi
    window.addEventListener("keydown", keyHandler);

    // Remove on cleanup
    return () => window.removeEventListener("keydown", keyHandler);
  }, [
    onLeftDown,
    onRightDown,
    onUpDown,
    onDownDown,
    onEnterDown,
    disabledKeyNav,
  ]);
};
