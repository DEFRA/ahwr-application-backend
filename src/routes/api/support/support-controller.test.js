import Boom from '@hapi/boom'
import { StatusCodes } from 'http-status-codes'
import { supportQueueMessagesHandler } from './support-controller.js'
import { getQueueMessages } from './support-service.js'

jest.mock('./support-service.js', () => ({
  getQueueMessages: jest.fn()
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
