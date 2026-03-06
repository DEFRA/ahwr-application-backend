import hapiPino from 'hapi-pino'
import { getLoggerOptions } from './logger-options.js'

export const requestLogger = {
  plugin: hapiPino,
  options: getLoggerOptions()
}
