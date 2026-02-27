import { config } from '../../config/config.js'
import { createServer } from '../../server.js'
import { runDistributedStartupJob } from '../../distributed-jobs/distributed-startup-job.js'

export async function startServer(options) {
  const server = await createServer(options)
  await server.start()
  const { logger } = server

  logger.info('Server started successfully')
  logger.info(`Access your backend on http://localhost:${config.get('port')}`)

  // asynchronous, awaiting might result in startup health check failures/timeouts
  runDistributedStartupJobInBackground(server.db, logger)

  return server
}

const runDistributedStartupJobInBackground = async (db, logger) => {
  try {
    await runDistributedStartupJob(db, logger.child({}))
  } catch (err) {
    logger.error('Distributed startup job error', err)
  }
}
