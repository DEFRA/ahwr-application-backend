import Boom from '@hapi/boom'
import { StatusCodes } from 'http-status-codes'
import {
  supportApplyQueueActionsHandler,
  supportIsDeadLetterQueueHandler,
  supportQueueMessagesHandler
} from './support-controller.js'
import {
  applyQueueMessageActions,
  checkIsDeadLetterQueue,
  getQueueMessages
} from './support-service.js'

jest.mock('./support-service.js', () => ({
  getQueueMessages: jest.fn(),
  checkIsDeadLetterQueue: jest.fn(),
  applyQueueMessageActions: jest.fn()
}))

describe('supportQueueMessagesHandler', () => {
  const request = {
    query: {
      queueUrl: 'https://sqs.test/queue',
      limit: 5
    },
    logger: {
      error: jest.fn()
    }
  }

  const response = {
    code: jest.fn().mockReturnThis()
  }
  const h = {
    response: jest.fn().mockReturnValue(response)
  }
  const queueMessages = [
    {
      id: '1',
      body: { sbi: '123456789', claimRef: 'FUBC-JTTU-SDQ7' },
      attributes: { attr: 'value' },
      messageAttributes: {
        eventType: { DataType: 'String', StringValue: 'uk.gov.ffc.ahwr.set.paid.status' }
      }
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns queue messages with 200 status', async () => {
    getQueueMessages.mockResolvedValue(queueMessages)

    await supportQueueMessagesHandler(request, h)

    expect(getQueueMessages).toHaveBeenCalledWith({
      queueUrl: request.query.queueUrl,
      limit: request.query.limit,
      logger: request.logger
    })

    expect(h.response).toHaveBeenCalledWith(queueMessages)
    expect(response.code).toHaveBeenCalledWith(StatusCodes.OK)
  })

  test('rethrows Boom errors', async () => {
    const boomError = Boom.badRequest('Invalid queue')
    getQueueMessages.mockRejectedValue(boomError)

    await expect(supportQueueMessagesHandler(request, h)).rejects.toThrow(boomError)

    expect(request.logger.error).toHaveBeenCalledWith(
      { error: boomError },
      'Failed to get queue messages'
    )
  })

  test('wraps unknown errors in Boom.internal', async () => {
    const error = new Error('Unexpected')
    getQueueMessages.mockRejectedValue(error)

    await expect(supportQueueMessagesHandler(request, h)).rejects.toThrow(Boom.internal(error))

    expect(request.logger.error).toHaveBeenCalledWith({ error }, 'Failed to get queue messages')
  })
})

describe('supportIsDeadLetterQueueHandler', () => {
  const request = {
    query: { queueUrl: 'https://sqs.test/queue-dlq' },
    logger: { error: jest.fn() }
  }
  const response = { code: jest.fn().mockReturnThis() }
  const h = { response: jest.fn().mockReturnValue(response) }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns the dead-letter flag with 200 status', async () => {
    checkIsDeadLetterQueue.mockResolvedValue(true)

    await supportIsDeadLetterQueueHandler(request, h)

    expect(checkIsDeadLetterQueue).toHaveBeenCalledWith({
      queueUrl: request.query.queueUrl,
      logger: request.logger
    })
    expect(h.response).toHaveBeenCalledWith({ isDlq: true })
    expect(response.code).toHaveBeenCalledWith(StatusCodes.OK)
  })

  test('rethrows Boom errors', async () => {
    const boomError = Boom.notFound('Queue not found')
    checkIsDeadLetterQueue.mockRejectedValue(boomError)

    await expect(supportIsDeadLetterQueueHandler(request, h)).rejects.toThrow(boomError)
    expect(request.logger.error).toHaveBeenCalledWith(
      { error: boomError },
      'Failed to check if queue is a dead-letter queue'
    )
  })

  test('wraps unknown errors in Boom.internal', async () => {
    const error = new Error('Unexpected')
    checkIsDeadLetterQueue.mockRejectedValue(error)

    await expect(supportIsDeadLetterQueueHandler(request, h)).rejects.toThrow(Boom.internal(error))
  })
})

describe('supportApplyQueueActionsHandler', () => {
  const request = {
    payload: {
      queueUrl: 'https://sqs.test/queue-dlq',
      actions: [
        { id: '1', action: 'delete' },
        { id: '2', action: 'reapply' }
      ]
    },
    logger: { error: jest.fn() }
  }
  const response = { code: jest.fn().mockReturnThis() }
  const h = { response: jest.fn().mockReturnValue(response) }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('applies the actions and returns the result with 200 status', async () => {
    const result = [{ id: '1', action: 'delete', status: 'done' }]
    applyQueueMessageActions.mockResolvedValue(result)

    await supportApplyQueueActionsHandler(request, h)

    expect(applyQueueMessageActions).toHaveBeenCalledWith({
      queueUrl: request.payload.queueUrl,
      actionsById: { 1: 'delete', 2: 'reapply' },
      logger: request.logger
    })
    expect(h.response).toHaveBeenCalledWith(result)
    expect(response.code).toHaveBeenCalledWith(StatusCodes.OK)
  })

  test('rethrows Boom errors', async () => {
    const boomError = Boom.badRequest('Not a dead-letter queue')
    applyQueueMessageActions.mockRejectedValue(boomError)

    await expect(supportApplyQueueActionsHandler(request, h)).rejects.toThrow(boomError)
    expect(request.logger.error).toHaveBeenCalledWith(
      { error: boomError },
      'Failed to apply queue message actions'
    )
  })

  test('wraps unknown errors in Boom.internal', async () => {
    const error = new Error('Unexpected')
    applyQueueMessageActions.mockRejectedValue(error)

    await expect(supportApplyQueueActionsHandler(request, h)).rejects.toThrow(Boom.internal(error))
  })
})
