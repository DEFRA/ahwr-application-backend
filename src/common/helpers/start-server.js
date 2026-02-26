import { config } from '../../config/config.js'
import { createServer } from '../../server.js'
import { runDistributedStartupJob } from '../../distributed-jobs/distributed-startup-job.js'

export async function startServer(options) {
  const server = await createServer(options)
  await server.start()
  const logger = server.logger

  logger.info('Server started successfully')
  logger.info(`Access your backend on http://localhost:${config.get('port')}`)

  // asynchronous, adding await might result in startup health check failures/timeouts
  runDistributedStartupJob(server.db, logger).catch((err) => {
    logger.error('Distributed startup job error', err)
  })

  return server
}
