import { config } from '../../config.js'

import { createServer } from '../../server.js'

export async function startServer() {
  const server = await createServer()
  await server.start()

  server.logger.info('Server started successfully')
  server.logger.info(
    `Access your backend on http://localhost:${config.get('port')}`
  )

  // TODO 1182 await startMessagingService(server.logger)

  return server
}
