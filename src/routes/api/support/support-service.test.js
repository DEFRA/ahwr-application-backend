import { QueueDoesNotExist } from '@aws-sdk/client-sqs'
import { getQueueMessages } from './support-service'
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
})
