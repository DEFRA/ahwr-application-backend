import process from 'node:process'
import { stopFcpMessagingService } from './messaging/fcp-messaging-service.js'
import { getLogger } from './logging/logger.js'
import { startServer } from './common/helpers/start-server.js'

process.env.HTTPS_PROXY = process.env.HTTP_PROXY

await startServer()

process.on('unhandledRejection', async (error) => {
  const logger = getLogger()
  logger.error(error, 'Unhandled rejection')
  await stopFcpMessagingService()

  process.exit(1)
})
