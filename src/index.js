import process from 'node:process'
import { stopMessagingService } from './messaging/fcp-messaging-service.js'

import { getLogger } from './logging/logger.js'
import { startServer } from './common/helpers/start-server.js'

//TODO config
process.env.HTTPS_PROXY = process.env.HTTP_PROXY

console.log({
  httpProxy: process.env.HTTP_PROXY,
  httpsProxy: process.env.HTTPS_PROXY
})
await startServer()

process.on('unhandledRejection', async (error) => {
  const logger = getLogger()
  logger.info('Unhandled rejection')
  logger.error(error)
  await stopMessagingService()

  process.exitCode = 1
})
