import { health } from '../routes/health.js'
import { latestContactDetailsHandlers } from '../routes/api/latest-contact-details.js'
import { applicationHistoryHandlers } from '../routes/api/application-history.js'
import { applicationEventsHandlers } from '../routes/api/application-events.js'
import { claimHandlers } from '../routes/api/claim.js'
import { claimsHandlers } from '../routes/api/claims.js'
import { holidayHandlers } from '../routes/api/holidays.js'
import { contactHistoryHandlers } from '../routes/api/contact-history.js'
import { flagHandlers } from '../routes/api/flags.js'
import { redactPiiRequestHandlers } from '../routes/api/redact-pii.js'
import { applicationRoutes } from '../routes/api/applications/application-routes.js'

const router = {
  plugin: {
    name: 'router',
    register: (server, _options) => {
      server.route(
        [health]
          .concat(applicationRoutes)
          .concat(latestContactDetailsHandlers)
          .concat(applicationHistoryHandlers)
          .concat(applicationEventsHandlers)
          .concat(claimHandlers)
          .concat(claimsHandlers)
          .concat(holidayHandlers)
          .concat(contactHistoryHandlers)
          .concat(flagHandlers)
          .concat(redactPiiRequestHandlers)
      )
    }
  }
}

export { router }
