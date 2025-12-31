import Hapi from '@hapi/hapi'
import { secureContext } from '@defra/hapi-secure-context'
import { config } from './config/config.js'
import { router } from './plugins/router.js'
import { requestLogger } from './logging/request-logger.js'
import { mongoDb } from './common/helpers/mongodb.js'
import { failAction } from './common/helpers/fail-action.js'
import { pulse } from './common/helpers/pulse.js'
import { requestTracing } from './common/helpers/request-tracing.js'
import { setupProxy } from './common/helpers/proxy/setup-proxy.js'
import {
  configureAndStartMessaging,
  stopMessageSubscriber
} from './messaging/application-message-queue-subscriber.js'
import {
  startFcpMessagingService,
  stopFcpMessagingService
} from './messaging/fcp-messaging-service.js'
import { startPulseScheduling, stopPulseScheduling } from './scheduled/cron-scheduler.js'
import { getLogger } from './logging/logger.js'

async function createServer() {
  setupProxy()
  const server = Hapi.server({
    host: config.get('host'),
    port: config.get('port'),
    routes: {
      validate: {
        options: {
          abortEarly: false
        },
        failAction
      },
      security: {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: false
        },
        xss: 'enabled',
        noSniff: true,
        xframe: true
      }
    },
    router: {
      stripTrailingSlash: true
    }
  })

  // Hapi Plugins:
  // requestLogger  - automatically logs incoming requests
  // requestTracing - trace header logging and propagation
  // secureContext  - loads CA certificates from environment config
  // pulse          - provides shutdown handlers
  // mongoDb        - sets up mongo connection pool and attaches to `server` and `request` objects
  // router         - routes used in the app
  await server.register([
    requestLogger,
    requestTracing,
    secureContext,
    pulse,
    {
      plugin: mongoDb,
      options: config.get('mongo')
    },
    router
  ])

  server.events.on('start', async () => {
    await startPulseScheduling(server.db)
    await startFcpMessagingService(getLogger())
    await configureAndStartMessaging(server.db)
  })

  server.events.on('stop', async () => {
    await stopMessageSubscriber()
    await stopFcpMessagingService()
    await stopPulseScheduling()
  })

  return server
}

export { createServer }
