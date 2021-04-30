import config from '../utils/config.json'

/**
 * Simple debug logger for development use.
 * Used in `fetchNui` and `useNuiEvent`.
 *
 * @param action - The action of this debug log
 * @param data - Data you wish to debug
 * @param context - Optional context
 */
export const debugLog = (action: string, data: unknown, context: string = 'Unknown') => {
  if (config.DEBUG_MODE) {
    console.group(`${context} | Action: ${action}`)
    console.dir(data)
    console.groupEnd()
  }
}

interface DebugEvent<T = any> {
  action: string;
  data: T;
}

/**
 * Emulates data we'll have in production.
 * @param events - The event you want to cover 
 * @param timer - How long until it should trigger (ms)
 */
export const debugData = <P>(events: DebugEvent<P>[], timer = 1000) => {
  if (process.env.NODE_ENV === 'development') {
    for (const event of events) {
      setTimeout(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              action: event.action,
              data: event.data,
            },
          }),
        );
      }, timer);
    }
  }
};
