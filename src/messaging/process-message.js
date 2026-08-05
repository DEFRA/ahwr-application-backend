import { config } from '../config/config.js'
import { setPaymentStatusToPaid } from './application/set-payment-status-to-paid.js'
import { metricsCounter } from '../common/helpers/metrics.js'

const { moveClaimToPaidMsgType } = config.get('messageTypes')

export const processApplicationMessage = async (message, db, logger, attributes) => {
  try {
    const { eventType } = attributes
    await metricsCounter(`application_message_received-${eventType}`)

    if (eventType === moveClaimToPaidMsgType) {
      await setPaymentStatusToPaid(message, db, logger)
    } else {
      logger.warn(`Unknown message type: ${eventType}`)
    }
  } catch (err) {
    logger.error(err, 'Unable to process Application request:')
  }
}
