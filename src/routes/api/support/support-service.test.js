import { getQueueMessages } from './support-service'
import { sqsClient } from 'ffc-ahwr-common-library'

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
})
