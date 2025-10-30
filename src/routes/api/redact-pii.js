import HttpStatus from 'http-status-codes'
import { config } from '../../config/config.js'
import { sendMessageToSQS } from '../../messaging/send-message.js'

const { redactPiiRequestMsgType } = {
  redactPiiRequestMsgType: 'uk.gov.ahwr.redact.pii.request'
}
const applicationQueueUrl = config.get('application.queueUrl')

const getMessageAttributes = () => {
  return {
    MessageType: { DataType: 'String', StringValue: redactPiiRequestMsgType }
  }
}

const getMessageBody = () => {
  const now = new Date()
  const utcMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )
  return JSON.stringify({ requestedDate: utcMidnight })
}

export const redactPiiRequestHandlers = [
  {
    method: 'POST',
    path: '/api/redact/pii',
    handler: async (request, h) => {
      request.logger.info('Request for redact PII received')

      await sendMessageToSQS(
        applicationQueueUrl,
        getMessageBody(),
        getMessageAttributes()
      )

      return h.response().code(HttpStatus.ACCEPTED)
    }
  }
]
