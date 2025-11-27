import { deleteFlagHandler, getAllFlagsHandler, createFlagHandler } from './flags-controller.js'
import {
  deleteFlagQuerySchema,
  deleteFlagPayloadSchema,
  createFlagQuerySchema,
  createFlagPayloadSchema
} from './flags-schema.js'
import Boom from '@hapi/boom'

export const flagRoutes = [
  {
    method: 'PATCH',
    path: '/api/flags/{flagId}/delete',
    options: {
      handler: deleteFlagHandler,
      description: 'Delete a flag by its ID',
      validate: {
        query: deleteFlagQuerySchema,
        payload: deleteFlagPayloadSchema,
        failAction: (request, _h, err) => {
          request.logger.error(
            { error: { message: err.message, stack: err.stack } },
            'Delete flag validation error'
          )
          throw Boom.badRequest(err.message)
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/flags',
    options: {
      description: 'Get all flags across all applications',
      handler: getAllFlagsHandler
    }
  },
  {
    method: 'POST',
    path: '/api/applications/{ref}/flag',
    options: {
      description: 'Create a new flag for application with ref',
      validate: {
        params: createFlagQuerySchema,
        payload: createFlagPayloadSchema,
        failAction: (request, _h, err) => {
          request.logger.error(
            { error: { message: err.message, stack: err.stack } },
            'Create flag validation error'
          )
          throw Boom.badRequest(err.message)
        }
      },
      handler: createFlagHandler
    }
  }
]
