import { health } from '../routes/health.js'
import { latestContactDetailsHandlers } from '../routes/api/latest-contact-details.js'
import { applicationHistoryHandlers } from '../routes/api/application-history.js'
import { applicationEventsHandlers } from '../routes/api/application-events.js'
import { claimHandlers } from '../routes/api/claims/claims-routes.js'
import { claimsHandlers } from '../routes/api/claims.js'
import { contactHistoryHandlers } from '../routes/api/contact-history.js'
import { redactPiiRequestHandlers } from '../routes/api/redact-pii.js'
import { applicationRoutes } from '../routes/api/applications/applications-routes.js'
import { applicationHandlers } from '../routes/api/applications.js'
import { flagRoutes } from '../routes/api/flags/flags-routes.js'

const router = {
  plugin: {
    name: 'router',
    register: (server, _options) => {
      server.route(
        [health]
          .concat(applicationHandlers)
          .concat(applicationRoutes)
          .concat(latestContactDetailsHandlers)
          .concat(applicationHistoryHandlers)
          .concat(applicationEventsHandlers)
          .concat(claimHandlers)
          .concat(claimsHandlers)
          .concat(contactHistoryHandlers)
          .concat(flagRoutes)
          .concat(redactPiiRequestHandlers)
      )
    }
  }
}

export { router }
