import { pino } from 'pino'
import { loggerOptions } from './logger-options.js'

const logger = pino(loggerOptions)

export function getLogger() {
  return logger
}

export const trackError = (loggerInstance, error, category, message) => {
  loggerInstance.error(
    {
      error,
      event: {
        type: 'exception',
        severity: 'error',
        category
      }
    },
    message
  )
}
