import { pino } from 'pino'
import { getLoggerOptions } from './logger-options.js'

let logger

export function getLogger() {
  if (!logger) {
    logger = pino(getLoggerOptions())
  }
  return logger
}

export const trackError = (loggerInstance, error, category, message) => {
  loggerInstance.error(
    {
      error,
      event: {
        type: 'exception',
        category
      }
    },
    message
  )
}
