import { config } from '../config/config.js'
import { setPaymentStatusToPaid } from './application/set-payment-status-to-paid.js'
import { metricsCounter } from '../common/helpers/metrics.js'

const { moveClaimToPaidMsgType } = config.get('messageTypes')

export const processApplicationMessage = async (message, db, logger, attributes) => {
  try {
    const { eventType } = attributes
    await metricsCounter(`application_message_received-${eventType}`)

    switch (eventType) {
      case moveClaimToPaidMsgType:
        await setPaymentStatusToPaid(message, db, logger)
        break
      default:
        logger.warn(`Unknown message type: ${eventType}`)
        break
    }
  } catch (err) {
    logger.error(err, 'Unable to process Application request:')
  }
}
