import {
  createApplicationHandler,
  getApplicationsHandler,
  getApplicationClaimsHandler
} from './application-controller.js'
import {
  newApplicationSchema,
  getApplicationsQuerySchema,
  getApplicationClaimsQuerySchema
} from './application-schema.js'
import Boom from '@hapi/boom'
import Joi from 'joi'

export const applicationRoutes = [
  {
    method: 'POST',
    path: '/api/applications',
    options: {
      handler: createApplicationHandler,
      validate: {
        payload: newApplicationSchema,
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
  },
  {
    method: 'GET',
    path: '/api/applications/{applicationReference}/claims',
    options: {
      handler: getApplicationClaimsHandler,
      validate: {
        params: Joi.object({ applicationReference: Joi.string() }),
        query: getApplicationClaimsQuerySchema,
        failAction(request, _h, err) {
          request.logger.error(err, 'Get claims validation error')
          throw Boom.badRequest(err.message)
        }
      }
    }
  }
]
