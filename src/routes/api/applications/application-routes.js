import {
  createApplicationHandler,
  getApplicationsHandler
} from './application-controller.js'
import {
  applicationSchema,
  getApplicationsQuerySchema
} from './application-schema.js'
import Boom from '@hapi/boom'

export const applicationRoutes = [
  {
    method: 'POST',
    path: '/api/applications',
    options: {
      handler: createApplicationHandler,
      validate: {
        payload: applicationSchema,
        failAction: async (request, _h, err) => {
          request.logger.error(err, 'Create application validation error')
          // TODO
          // appInsights.defaultClient.trackException({ exception: err })
          throw Boom.badRequest(err)
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/applications',
    options: {
      handler: getApplicationsHandler,
      validate: {
        query: getApplicationsQuerySchema,
        failAction(request, _h, err) {
          request.logger.error(err, 'Get application validation error')
          throw Boom.badRequest(err.message)
        }
      }
    }
  }
]
