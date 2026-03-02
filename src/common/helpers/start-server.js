import { config } from '../../config/config.js'
import { createServer } from '../../server.js'

export async function startServer(options) {
  const server = await createServer(options)
  await server.start()
  const { logger } = server

  logger.info('Server started successfully')
  logger.info(`Access your backend on http://localhost:${config.get('port')}`)

  return server
}
