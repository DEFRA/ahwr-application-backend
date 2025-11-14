import { config } from '../../config/config.js'
import { createServer } from '../../server.js'
import { startMessagingService } from '../../messaging/fcp-messaging-service.js'

export async function startServer() {
  const server = await createServer()
  await server.start()

  server.logger.info('Server started successfully')
  server.logger.info(
    `Access your backend on http://localhost:${config.get('port')}`
  )

  await startMessagingService(server.logger)

  return server
}
