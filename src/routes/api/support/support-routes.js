import joi from 'joi'
import {
  supportApplicationHandler,
  supportClaimHandler,
  supportHerdHandler
} from './support-controller'

export const supportHandlers = [
  {
    method: 'GET',
    path: '/api/support/application/{reference}',
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
    path: '/api/support/claim/{reference}',
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
    path: '/api/support/herd/{reference}',
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
