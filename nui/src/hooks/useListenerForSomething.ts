import { useEffect } from "react";
import { useIsMenuVisible } from "../state/visibility.state";

const seq = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

let currentIdx = 0;

export const useListenerForSomething = () => {
  const isMenuVisible = useIsMenuVisible();

  useEffect(() => {
    if (!isMenuVisible) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === seq[currentIdx]) {
        currentIdx++;
        if (currentIdx >= seq.length) {
          // ee after seq?
          console.log("seq entered successfully");
        }
      } else {
        currentIdx = 0;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isMenuVisible]);
};
