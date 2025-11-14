import { config } from '../config/config.js'
import { setPaymentStatusToPaid } from './application/set-payment-status-to-paid.js'
import { processRedactPiiRequest } from './application/process-redact-pii.js'
import { processReminderEmailRequest } from './application/process-reminder-email.js'

const {
  moveClaimToPaidMsgType,
  redactPiiRequestMsgType,
  reminderEmailRequestMsgType
} = config.get('messageTypes')

export const processApplicationMessage = async (message, receiver, logger) => {
  try {
    const { applicationProperties: properties } = message

    switch (properties.type) {
      case moveClaimToPaidMsgType:
        await setPaymentStatusToPaid(message, logger)
        break
      case redactPiiRequestMsgType:
        await processRedactPiiRequest(message, logger)
        break
      case reminderEmailRequestMsgType:
        await processReminderEmailRequest(message, logger)
        break
      default:
        logger.warn(`Unknown message type: ${properties.type}`)
        break
    }

    await receiver.completeMessage(message)
  } catch (err) {
    logger.error('Unable to process Application request:', err)
  }
}
