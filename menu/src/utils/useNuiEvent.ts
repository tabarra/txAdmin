import { MutableRefObject, useEffect, useRef } from "react";

interface IOptions {
  capture?: boolean;
  passive?: boolean;
  once?: boolean;
}

/**
 * A hook that manage events listeners for receiving data from the NUI
 * @param method The specific `method` field that should be listened for.
 * @param handler The callback function that will handle data relayed by this hook
 * @param options Any options to pass to the addEventListener
 **/

const defaultOptions = {};

export const useNuiEvent = <S = Record<string, unknown>>(
  method: string,
  handler: Function,
  currentState?: S,
  options: IOptions = defaultOptions
) => {
  const savedHandler: MutableRefObject<any> = useRef();

  // When handler value changes set mutable ref to handler val
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  // Will run every rerender
  useEffect(() => {
    const eventListener = (event) => {
      if (savedHandler.current && savedHandler.current.call) {
        const { data } = event;

        const newData = currentState ? { ...currentState, ...data } : data;
        savedHandler.current(newData);
      }
    };

    window.addEventListener(method, eventListener, options);
    // Remove Event Listener on component cleanup
    return () => window.removeEventListener(method, eventListener, options);
  }, [method, currentState, options]);
};
