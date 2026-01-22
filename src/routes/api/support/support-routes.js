import joi from 'joi'
import {
  supportApplicationHandler,
  supportClaimHandler,
  supportHerdHandler
} from './support-controller'

export const supportHandlers = [
  {
    method: 'GET',
    path: '/api/support/applications/{reference}',
    options: {
      description: 'Get a claim by reference',
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
    path: '/api/support/herds/{reference}',
    options: {
      description: 'Get a claim by reference',
      validate: {
        params: joi.object({
          reference: joi.string().required()
        })
      },
      handler: supportHerdHandler
    }
  }
]
