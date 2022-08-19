import { useEffect } from "react";

export const useKey = (key: string, handler: () => void) => {
  useEffect(() => {
    const keyListener = (e: KeyboardEvent) => {
      if (e.code === key) {
        e.preventDefault();
        handler();
      }
    };

    window.addEventListener("keydown", keyListener);
    return () => window.removeEventListener("keydown", keyListener);
  }, [handler, key]);
};
