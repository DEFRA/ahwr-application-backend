import process from 'node:process'

import { getLogger } from './logging/logger.js'
import { startServer } from './common/helpers/start-server.js'

await startServer()

process.on('unhandledRejection', (error) => {
  const logger = getLogger()
  logger.info('Unhandled rejection')
  logger.error(error)
  process.exitCode = 1
})
