import { configureAndStart, stopSubscriber } from './message-request-queue-subscriber.js'
import { SqsSubscriber } from 'ffc-ahwr-common-library'
import { getLogger } from '../logging/logger.js'
import { config } from '../config/config.js'

jest.mock('../logging/logger.js')
jest.mock('ffc-ahwr-common-library')

describe('MessageRequestQueueSubscriber', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    config.set(
      'sqs.applicationRequestQueueUrl',
      'http://localhost:4576/queue/application-request-queue'
    )
    config.set('aws.region', 'eu-west-2')
    config.set('aws.endpointUrl', 'http://localhost:4576')
  })

  describe('configureAndStart', () => {
    it('should configure and start the SQS subscriber', async () => {
      const mockLogger = jest.fn()
      getLogger.mockReturnValueOnce(mockLogger)
      const mockDb = {}

      await configureAndStart(mockDb)

      expect(SqsSubscriber).toHaveBeenCalledTimes(1)
      expect(SqsSubscriber).toHaveBeenCalledWith({
        awsEndpointUrl: 'http://localhost:4576',
        logger: mockLogger,
        region: 'eu-west-2',
        queueUrl: 'http://localhost:4576/queue/application-request-queue',
        onMessage: expect.any(Function)
      })
      expect(SqsSubscriber.mock.instances[0].start).toHaveBeenCalledTimes(1)
    })
  })

  describe('stopSubscriber', () => {
    it('should stop the SQS subscriber', async () => {
      const mockLogger = jest.fn()
      getLogger.mockReturnValueOnce(mockLogger)
      const mockDb = {}

      await configureAndStart(mockDb)

      await stopSubscriber()

      const subscriberInstance = SqsSubscriber.mock.instances[0]

      expect(subscriberInstance.stop).toHaveBeenCalledTimes(1)
    })

    it('should do nothing if the SQS subscriber is not present', async () => {
      const mockLogger = jest.fn()
      getLogger.mockReturnValueOnce(mockLogger)

      await stopSubscriber()

      const subscriberInstance = SqsSubscriber.mock.instances[0]

      expect(subscriberInstance).toBeUndefined()
    })
  })
})
