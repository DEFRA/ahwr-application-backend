import { config } from '../config/config.js'
import { processApplicationMessage } from './process-message.js'
import { setPaymentStatusToPaid } from './application/set-payment-status-to-paid.js'
const { moveClaimToPaidMsgType } = config.get('messageTypes')

jest.mock('./application/set-payment-status-to-paid.js')
jest.mock('./application/process-redact-pii.js')
jest.mock('./application/process-reminder-email.js')

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
  })
})
