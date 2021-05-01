import { useEffect } from "react";

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
  useEffect(() => {
    // Our basic handler function for keydown events
    const keyHandler = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowLeft":
          e.preventDefault();
          onLeftDown && onLeftDown();
          break;
        case "ArrowRight":
          e.preventDefault();
          onRightDown && onRightDown();
          break;
        case "ArrowUp":
          e.preventDefault();
          onUpDown && onUpDown();
          break;
        case "ArrowDown":
          e.preventDefault();
          onDownDown && onDownDown();
          break;
        case 'Enter':
          e.preventDefault();
          onEnterDown && onEnterDown();
          break;
      }
    };

    // Add that boi
    window.addEventListener("keydown", keyHandler);

    // Remove on cleanup
    return () => window.removeEventListener("keydown", keyHandler);
  }, [onLeftDown, onRightDown, onUpDown, onDownDown, onEnterDown]);
};
