import {
  configureAndStartMessaging,
  stopMessageSubscriber
} from './application-message-queue-subscriber.js'
import { SqsSubscriber } from 'ffc-ahwr-common-library'
import { getLogger } from '../logging/logger.js'
import { config } from '../config/config.js'
import { processApplicationMessage } from './process-message.js'

jest.mock('../logging/logger.js')
jest.mock('ffc-ahwr-common-library')
jest.mock('./process-message.js')

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

  describe('configureAndStartMessaging', () => {
    it('should configure and start the SQS subscriber', async () => {
      const mockLogger = jest.fn()
      getLogger.mockReturnValueOnce(mockLogger)
      const mockDb = {}

      await configureAndStartMessaging(mockDb)

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

    it('should pass message on via onmessage function', async () => {
      const mockLogger = { info: jest.fn() }
      getLogger.mockReturnValue(mockLogger)
      processApplicationMessage.mockResolvedValueOnce()
      const mockDb = {}

      const onMessage = await configureAndStartMessaging(mockDb)

      await onMessage({ claimRef: 'ABC123', sbi: '123456789' }, {})

      expect(mockLogger.info).toHaveBeenCalledTimes(1)
      expect(processApplicationMessage).toHaveBeenCalledTimes(1)
    })
  })

  describe('stopMessageSubscriber', () => {
    it('should stop the SQS subscriber', async () => {
      const mockLogger = jest.fn()
      getLogger.mockReturnValueOnce(mockLogger)
      const mockDb = {}

      await configureAndStartMessaging(mockDb)

      await stopMessageSubscriber()

      const subscriberInstance = SqsSubscriber.mock.instances[0]

      expect(subscriberInstance.stop).toHaveBeenCalledTimes(1)
    })

    it('should do nothing if the SQS subscriber is not present', async () => {
      const mockLogger = jest.fn()
      getLogger.mockReturnValueOnce(mockLogger)

      await stopMessageSubscriber()

      const subscriberInstance = SqsSubscriber.mock.instances[0]

      expect(subscriberInstance).toBeUndefined()
    })
  })
})
