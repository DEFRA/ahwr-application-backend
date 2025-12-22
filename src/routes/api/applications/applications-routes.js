import {
  createApplicationHandler,
  getApplicationsHandler,
  getApplicationClaimsHandler,
  getApplicationHerdsHandler,
  getApplicationHandler,
  updateEligibleForPiiRedactionHandler,
  updateApplicationDataHandler
} from './applications-controller.js'
import {
  newApplicationSchema,
  getApplicationsQuerySchema,
  getApplicationClaimsQuerySchema,
  getApplicationHerdsQuerySchema
} from './applications-schema.js'
import Boom from '@hapi/boom'
import Joi from 'Joi'
import { searchPayloadSchema } from '../schema/search-payload.schema.js'
import HttpStatus from 'http-status-codes'
import { searchApplications } from '../../../repositories/application-repository.js'

export const applicationRoutes = [
  {
    method: 'POST',
    path: '/api/applications',
    options: {
      description: 'Create a new application',
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
      description: 'Get all applications by SBI',
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
      description: 'Get claims for an application by reference',
      handler: getApplicationClaimsHandler,
      validate: {
        params: Joi.object({ applicationReference: Joi.string() }),
        query: getApplicationClaimsQuerySchema,
        failAction(request, _h, err) {
          request.logger.error(err, 'Get application claims validation error')
          throw Boom.badRequest(err.message)
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/applications/{applicationReference}/herds',
    options: {
      description: 'Get herds for an application by reference',
      handler: getApplicationHerdsHandler,
      validate: {
        params: Joi.object({ applicationReference: Joi.string() }),
        query: getApplicationHerdsQuerySchema,
        failAction(request, _h, err) {
          request.logger.error(err, 'Get application herds validation error')
          throw Boom.badRequest(err.message)
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/applications/{applicationReference}',
    options: {
      description: 'Get an application by reference',
      handler: getApplicationHandler,
      validate: {
        params: Joi.object({ applicationReference: Joi.string() }),
        failAction(request, _h, err) {
          request.logger.error(err, 'Get application validation error')
          throw Boom.badRequest(err.message)
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/applications/search',
    options: {
      description: 'Search for applications based on search criteria',
      validate: {
        payload: Joi.object({
          ...searchPayloadSchema,
          sort: Joi.object({
            field: Joi.string().valid().optional().default('CREATEDAT'),
            direction: Joi.string().valid().optional().allow('ASC')
          }).optional(),
          filter: Joi.array().optional()
        }),
        failAction: async (request, h, err) => {
          request.logger.error({ err })
          return h.response({ err }).code(HttpStatus.BAD_REQUEST).takeover()
        }
      },
      handler: async (request, h) => {
        const { applications, total } = await searchApplications(
          request.db,
          request.payload.search?.text ?? '',
          request.payload.search?.type,
          request.payload.filter,
          request.payload.offset,
          request.payload.limit,
          request.payload.sort
        )

        return h
          .response({
            applications,
            total
          })
          .code(HttpStatus.OK)
      }
    }
  },
  {
    method: 'PUT',
    path: '/api/applications/{reference}/data',
    options: {
      description: 'Update data items for an application',
      validate: {
        params: Joi.object({
          reference: Joi.string()
        }),
        payload: Joi.object({
          vetName: Joi.string(),
          visitDate: Joi.date(),
          vetRcvs: Joi.string().pattern(/^\d{6}[\dX]$/i),
          note: Joi.string().required(),
          user: Joi.string().required()
        })
          .or('vetName', 'visitDate', 'vetRcvs')
          .required(),
        failAction: async (request, h, err) => {
          request.logger.error(err, 'Update application data validation error')
          throw Boom.badRequest(err.message)
        }
      },
      handler: updateApplicationDataHandler
    }
  },
  {
    method: 'PUT',
    path: '/api/applications/{ref}/eligible-pii-redaction',
    options: {
      description: 'Update eligiblePiiRedaction value for an application',
      validate: {
        params: Joi.object({
          ref: Joi.string().required()
        }),
        payload: Joi.object({
          eligiblePiiRedaction: Joi.bool().required(),
          note: Joi.string().required(),
          user: Joi.string().required()
        }),
        failAction: async (request, _h, err) => {
          request.logger.error(err, 'Update application eligiblePiiRedaction validation error')
          throw Boom.badRequest(err.message)
        }
      },
      handler: updateEligibleForPiiRedactionHandler
    }
  }
]
