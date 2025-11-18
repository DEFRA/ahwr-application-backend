import { config } from '../../src/config/config.js'
import { createServer } from '../../src/server'
import HttpStatus from 'http-status-codes'
import { sendMessageToSQS } from '../../src/messaging/send-message.js' // TODO BH Impl

jest.mock('../../src/messaging/send-message.js')

const reminderEmailRequestMsgType = config.get(
  'messageTypes.reminderEmailRequestMsgType'
)
const applicationQueueUrl = config.get('application.queueUrl')
const reminderEmailMaxBatchSize = config.get('reminderEmailMaxBatchSize')

describe('reminder-email', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
  })

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  afterAll(async () => {
    server.stop()
  })

  describe('POST /api/email/reminder', () => {
    it('should return ACCEPTED status and queue reminder email message when called with empty payload', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/email/reminder',
        payload: {}
      })

      expect(res.statusCode).toBe(HttpStatus.ACCEPTED)
      expect(sendMessageToSQS).toHaveBeenCalledWith(
        applicationQueueUrl,
        {
          requestedDate: expect.any(Date),
          maxBatchSize: reminderEmailMaxBatchSize
        },
        {
          MessageType: {
            DataType: 'String',
            StringValue: reminderEmailRequestMsgType
          }
        }
      )
    })
  })
})
