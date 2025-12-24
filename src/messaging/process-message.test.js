import { config } from '../config/config.js'
import { processApplicationMessage } from './process-message.js'
import { setPaymentStatusToPaid } from './application/set-payment-status-to-paid.js'
import { metricsCounter } from '../common/helpers/metrics.js'
const { moveClaimToPaidMsgType } = config.get('messageTypes')

jest.mock('./application/set-payment-status-to-paid.js')
jest.mock('./application/process-redact-pii.js')
jest.mock('./application/process-reminder-email.js')
jest.mock('../common/helpers/metrics.js')

describe('Process Message test', () => {
  const mockDb = {}
  const mockLogger = {
    warn: jest.fn(),
    error: jest.fn()
  }

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test(`${moveClaimToPaidMsgType} message calls setPaymentStatusToPaid`, async () => {
    const message = {
      claimRef: 'FUBC-1234-5678',
      sbi: '123456789'
    }
    const attributes = {
      eventType: moveClaimToPaidMsgType
    }

    await processApplicationMessage(message, mockDb, mockLogger, attributes)

    expect(setPaymentStatusToPaid).toHaveBeenCalledTimes(1)
    expect(setPaymentStatusToPaid).toHaveBeenCalledWith(message, mockDb, mockLogger)
    expect(metricsCounter).toHaveBeenCalledWith(
      'application_message_received-uk.gov.ffc.ahwr.set.paid.status'
    )
  })

  test('unknown message calls nothing', async () => {
    const message = {
      requestDate: new Date()
    }
    const attributes = {
      eventType: 'unknown'
    }

    await processApplicationMessage(message, mockDb, mockLogger, attributes)

    expect(mockLogger.warn).toHaveBeenCalledTimes(1)
    expect(metricsCounter).toHaveBeenCalledWith('application_message_received-unknown')
  })
})
