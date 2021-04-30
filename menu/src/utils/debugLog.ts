import config from '../utils/config.json'

export const debugLog = (action: string, data: unknown, context: string = 'Unknown') => {
  if (config.DEBUG_MODE) {
    console.group(`${context} | Action: ${action}`)
    console.dir(data)
    console.groupEnd()
  }
}