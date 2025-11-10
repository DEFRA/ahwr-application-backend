import process from 'node:process'

import { getLogger } from './logging/logger.js'
import { startServer } from './common/helpers/start-server.js'

//TODO config
process.env.HTTPS_PROXY = process.env.HTTP_PROXY

await startServer()

process.on('unhandledRejection', (error) => {
  const logger = getLogger()
  logger.info('Unhandled rejection')
  logger.error(error)
  process.exitCode = 1
})
