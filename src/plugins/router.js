import { health } from '../routes/health.js'
import { latestContactDetailsHandlers } from '../routes/api/latest-contact-details.js'
import { applicationHistoryHandlers } from '../routes/api/application-history.js'
import { claimsHandlers } from '../routes/api/claims/claims-routes.js'
import { contactHistoryHandlers } from '../routes/api/contact-history.js'
import { applicationRoutes } from '../routes/api/applications/applications-routes.js'
import { applicationHandlers } from '../routes/api/applications.js'
import { flagHandlers } from '../routes/api/flags/flags-routes.js'
import { claimHistoryHandlers } from '../routes/api/claim-history.js'
import { config } from '../config/config.js'
import { cleanupHandlers } from '../routes/api/cleanup/cleanup-routes.js'

const router = {
  plugin: {
    name: 'router',
    register: (server, _options) => {
      let routes = [health]
        .concat(applicationHandlers)
        .concat(applicationRoutes)
        .concat(latestContactDetailsHandlers)
        .concat(applicationHistoryHandlers)
        .concat(claimHistoryHandlers)
        .concat(claimsHandlers)
        .concat(contactHistoryHandlers)
        .concat(flagHandlers)

      if (
        ['local', 'infra-dev', 'management', 'dev', 'test', 'perf-test', 'ext-test'].includes(
          config.get('cdpEnvironment')
        )
      ) {
        routes = routes.concat(cleanupHandlers)
      }

      server.route(routes)
    }
  }
}

export { router }
