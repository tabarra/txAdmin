import { isBrowserEnv } from "./miscUtils";

interface DebugEvent<T = any> {
  action: string;
  data: T;
}

/**
 * Emulates data we'll have in production.
 * @param events - The event you want to cover
 * @param timer - How long until it should trigger (ms)
 */
export const debugData = <P>(events: DebugEvent<P>[], timer = 1000): void => {
  if(!isBrowserEnv()) return;
  
  for (const event of events) {
    setTimeout(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            action: event.action,
            data: event.data,
          },
        })
      );
    }, timer);
  }
};
