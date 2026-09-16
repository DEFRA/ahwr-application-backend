import { QueueDoesNotExist } from '@aws-sdk/client-sqs'
import {
  applyQueueMessageActions,
  checkIsDeadLetterQueue,
  getQueueMessages
} from './support-service'
import { sqsClient } from 'ffc-ahwr-common-library'
import Boom from '@hapi/boom'

jest.mock('../../../config/config.js', () => ({
  config: {
    get: (key) => {
      if (key === 'aws.region') {
        return 'eu-west-2'
      }
      if (key === 'aws.endpointUrl') {
        return 'http://localhost:4566'
      }
    }
  }
}))
jest.mock('ffc-ahwr-common-library')

describe('getQueueMessages', () => {
  const loggerMock = {
    info: jest.fn()
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should retrieve messages and render them', async () => {
    sqsClient.peekMessages.mockResolvedValue([
      {
        id: '1',
        body: { sbi: '123456789', claimRef: 'FUBC-JTTU-SDQ7' },
        attributes: { attr: 'value' },
        messageAttributes: {
          eventType: { DataType: 'String', StringValue: 'uk.gov.ffc.ahwr.set.paid.status' }
        }
      }
    ])

    const result = await getQueueMessages({
      queueUrl: 'http://localhost:45666/queueName',
      limit: 10,
      logger: loggerMock
    })

    expect(sqsClient.setupClient).toHaveBeenCalledWith(
      'eu-west-2',
      'http://localhost:4566',
      loggerMock
    )
    expect(sqsClient.peekMessages).toHaveBeenCalledWith('http://localhost:45666/queueName', 10)
    expect(result).toEqual([
      {
        id: '1',
        body: { sbi: '123456789', claimRef: 'FUBC-JTTU-SDQ7' },
        attributes: { attr: 'value' },
        messageAttributes: {
          eventType: { DataType: 'String', StringValue: 'uk.gov.ffc.ahwr.set.paid.status' }
        }
      }
    ])
  })

  it('should return empty array when no messages', async () => {
    sqsClient.peekMessages.mockResolvedValue([])

    const result = await getQueueMessages({
      queueUrl: 'localhost:45666',
      limit: 10,
      logger: loggerMock
    })

    expect(result).toEqual([])
  })

  it('should throw 404 error when queue does not exist', async () => {
    sqsClient.peekMessages.mockRejectedValue(
      new QueueDoesNotExist({
        message: 'The specified queue does not exist.',
        $metadata: {}
      })
    )

    await expect(
      getQueueMessages({
        queueUrl: 'localhost:45666',
        limit: 10,
        logger: loggerMock
      })
    ).rejects.toThrow(Boom.notFound(`Queue not found: localhost:45666`))
  })

  it('should rethrow errors that are not QueueDoesNotExist', async () => {
    const error = new Error('Unable to retrieve queue messages')
    sqsClient.peekMessages.mockRejectedValue(error)

    await expect(
      getQueueMessages({
        queueUrl: 'localhost:45666',
        limit: 10,
        logger: loggerMock
      })
    ).rejects.toThrow(error)
  })
})

describe('checkIsDeadLetterQueue', () => {
  const loggerMock = { info: jest.fn() }

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns the dead-letter queue flag from the sqs client', async () => {
    sqsClient.isDeadLetterQueue.mockResolvedValue(true)

    const result = await checkIsDeadLetterQueue({
      queueUrl: 'http://localhost:45666/queueName',
      logger: loggerMock
    })

    expect(sqsClient.setupClient).toHaveBeenCalledWith(
      'eu-west-2',
      'http://localhost:4566',
      loggerMock
    )
    expect(sqsClient.isDeadLetterQueue).toHaveBeenCalledWith('http://localhost:45666/queueName')
    expect(result).toBe(true)
  })

  it('should throw 404 error when queue does not exist', async () => {
    sqsClient.isDeadLetterQueue.mockRejectedValue(
      new QueueDoesNotExist({ message: 'The specified queue does not exist.', $metadata: {} })
    )

    await expect(
      checkIsDeadLetterQueue({ queueUrl: 'localhost:45666', logger: loggerMock })
    ).rejects.toThrow(Boom.notFound('Queue not found: localhost:45666'))
  })
})

describe('applyQueueMessageActions', () => {
  const loggerMock = { info: jest.fn() }

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('applies the actions when the queue is a dead-letter queue', async () => {
    sqsClient.isDeadLetterQueue.mockResolvedValue(true)
    sqsClient.applyDlqActions.mockResolvedValue([{ id: '1', action: 'delete', status: 'done' }])

    const result = await applyQueueMessageActions({
      queueUrl: 'http://localhost:45666/queueName',
      actionsById: { 1: 'delete' },
      logger: loggerMock
    })

    expect(sqsClient.applyDlqActions).toHaveBeenCalledWith('http://localhost:45666/queueName', {
      1: 'delete'
    })
    expect(result).toEqual([{ id: '1', action: 'delete', status: 'done' }])
  })

  it('throws 400 when the queue is not a dead-letter queue', async () => {
    sqsClient.isDeadLetterQueue.mockResolvedValue(false)

    await expect(
      applyQueueMessageActions({
        queueUrl: 'localhost:45666',
        actionsById: { 1: 'delete' },
        logger: loggerMock
      })
    ).rejects.toThrow(Boom.badRequest('Not a dead-letter queue: localhost:45666'))
    expect(sqsClient.applyDlqActions).not.toHaveBeenCalled()
  })

  it('throws 404 when the queue does not exist', async () => {
    sqsClient.isDeadLetterQueue.mockRejectedValue(
      new QueueDoesNotExist({ message: 'The specified queue does not exist.', $metadata: {} })
    )

    await expect(
      applyQueueMessageActions({
        queueUrl: 'localhost:45666',
        actionsById: { 1: 'delete' },
        logger: loggerMock
      })
    ).rejects.toThrow(Boom.notFound('Queue not found: localhost:45666'))
  })
})
