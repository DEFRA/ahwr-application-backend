import HttpStatus from 'http-status-codes'
import { config } from '../../config/config.js'
import { sendMessage } from '../../messaging/send-message.js'

const { messageTypes, application, reminderEmailMaxBatchSize } = config

export const reminderEmailRequestHandlers = [
  {
    method: 'POST',
    path: '/api/email/reminder',
    handler: async (request, h) => {
      request.logger.info('Request for reminder email received')

      const now = new Date()
      const utcMidnight = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
      )
      // TODO BH Impl
      sendMessage(
        { requestedDate: utcMidnight, maxBatchSize: reminderEmailMaxBatchSize },
        messageTypes.reminderEmailRequestMsgType,
        application.queueUrl
      )

      return h.response().code(HttpStatus.ACCEPTED)
    }
  }
]
