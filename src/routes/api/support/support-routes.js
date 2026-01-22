import joi from 'joi'
import {
  supportApplicationHandler,
  supportClaimHandler,
  supportHerdHandler
} from './support-controller.js'

export const supportHandlers = [
  {
    method: 'GET',
    path: '/api/support/applications/{reference}',
    options: {
      description: 'Get an application by reference',
      validate: {
        params: joi.object({
          reference: joi.string().required()
        })
      },
      handler: supportApplicationHandler
    }
  },
  {
    method: 'GET',
    path: '/api/support/claims/{reference}',
    options: {
      description: 'Get a claim by reference',
      validate: {
        params: joi.object({
          reference: joi.string().required()
        })
      },
      handler: supportClaimHandler
    }
  },
  {
    method: 'GET',
    path: '/api/support/herds/{id}',
    options: {
      description: 'Get a herd by id',
      validate: {
        params: joi.object({
          id: joi.string().required()
        })
      },
      handler: supportHerdHandler
    }
  }
]
