import joi from 'joi'
import {
  supportApplicationHandler,
  supportApplyQueueActionsHandler,
  supportClaimHandler,
  supportHerdHandler,
  supportIsDeadLetterQueueHandler,
  supportQueueMessagesHandler
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
  },
  {
    method: 'GET',
    path: '/api/support/queue-messages',
    options: {
      description: 'Get queue messages by url',
      validate: {
        query: joi.object({
          queueUrl: joi.string().required(),
          limit: joi.number().integer().optional()
        })
      },
      handler: supportQueueMessagesHandler
    }
  },
  {
    method: 'GET',
    path: '/api/support/queue-messages/is-dlq',
    options: {
      description: 'Check whether a queue is a dead-letter queue',
      validate: {
        query: joi.object({
          queueUrl: joi.string().required()
        })
      },
      handler: supportIsDeadLetterQueueHandler
    }
  },
  {
    method: 'POST',
    path: '/api/support/queue-messages/actions',
    options: {
      description: 'Delete or reapply dead-letter queue messages',
      validate: {
        payload: joi.object({
          queueUrl: joi.string().required(),
          actions: joi
            .array()
            .items(
              joi.object({
                id: joi.string().required(),
                action: joi.string().valid('delete', 'reapply').required()
              })
            )
            .min(1)
            .required()
        })
      },
      handler: supportApplyQueueActionsHandler
    }
  }
]
