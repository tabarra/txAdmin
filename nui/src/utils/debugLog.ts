/**
 * Simple debug logger for development use.
 * Used in `fetchNui` and `useNuiEvent`.
 *
 * @param action - The action of this debug log
 * @param data - Data you wish to debug
 * @param context - Optional context
 */
export const debugLog = (
  action: string,
  data: unknown,
  context = "Unknown"
): void => {
  if ((window as any).__MenuDebugMode) {
    console.group(`${context} | Action: ${action}`);
    console.dir(data);
    console.groupEnd();
  }
};
