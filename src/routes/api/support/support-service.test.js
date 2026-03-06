import { getQueueMessages } from './support-service'
import { SQSClient } from '@aws-sdk/client-sqs'

jest.mock('@aws-sdk/client-sqs')
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

describe('getQueueMessages', () => {
  const sendMock = jest.fn()
  const loggerMock = {
    info: jest.fn()
  }

  SQSClient.mockImplementation(() => ({
    send: sendMock
  }))

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should retrieve messages and render them', async () => {
    sendMock.mockResolvedValue({
      Messages: [
        {
          MessageId: '1',
          Body: { sbi: '123456789', claimRef: 'FUBC-JTTU-SDQ7' },
          Attributes: { attr: 'value' },
          MessageAttributes: {
            eventType: { DataType: 'String', StringValue: 'uk.gov.ffc.ahwr.set.paid.status' }
          }
        }
      ]
    })

    const result = await getQueueMessages({
      queueUrl: 'localhost:45666',
      limit: 10,
      logger: loggerMock
    })

    expect(SQSClient).toHaveBeenCalledWith({
      region: 'eu-west-2',
      endpoint: 'http://localhost:4566'
    })
    expect(sendMock).toHaveBeenCalled()
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
    sendMock.mockResolvedValue({ Messages: [] })

    const result = await getQueueMessages({
      queueUrl: 'localhost:45666',
      limit: 10,
      logger: loggerMock
    })

    expect(result).toEqual([])
  })
})
