import HttpStatus from 'http-status-codes'
import { config } from '../../config/config.js'
import { sendMessageToSQS } from '../../messaging/send-message.js'

const reminderEmailRequestMsgType = config.get(
  'messageTypes.reminderEmailRequestMsgType'
)
const applicationQueueUrl = config.get('application.queueUrl')
const reminderEmailMaxBatchSize = config.get('reminderEmailMaxBatchSize')

export const reminderEmailRequestHandlers = [
  {
    method: 'POST',
    path: '/api/email/reminder',
    handler: async (request, h) => {
      request.logger.info('Request for reminder email received')

      sendMessageToSQS(
        applicationQueueUrl,
        getMessageBody(),
        getMessageAttributes()
      )

      return h.response().code(HttpStatus.ACCEPTED)
    }
  }
]

const getMessageBody = () => {
  const now = new Date()
  const utcMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )
  return {
    requestedDate: utcMidnight,
    maxBatchSize: reminderEmailMaxBatchSize
  }
}

const getMessageAttributes = () => {
  return {
    MessageType: {
      DataType: 'String',
      StringValue: reminderEmailRequestMsgType
    }
  }
}
