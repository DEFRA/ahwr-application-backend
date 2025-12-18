import joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import { cleanupController } from './cleanup-controller.js'

export const cleanupHandlers = [
  {
    method: 'DELETE',
    path: '/api/cleanup',
    options: {
      validate: {
        query: joi.object({
          sbi: joi
            .array()
            .items(joi.string())
            .single() // allows ?sbi=123 as well as ?sbi=123&sbi=456
            .required()
        }),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ error: err })
          console.log(h.response().code())
          return h.response({ err }).code(StatusCodes.BAD_REQUEST).takeover()
        }
      },
      handler: cleanupController
    }
  }
]
