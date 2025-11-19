import { config } from '../config/config.js'
import { processApplicationMessage } from './process-message.js'
import { setPaymentStatusToPaid } from './application/set-payment-status-to-paid.js'
import { processRedactPiiRequest } from './application/process-redact-pii.js'
import { processReminderEmailRequest } from './application/process-reminder-email.js'

const {
  moveClaimToPaidMsgType,
  redactPiiRequestMsgType,
  reminderEmailRequestMsgType
} = config.get('messageTypes')

jest.mock('./application/set-payment-status-to-paid.js')
jest.mock('./application/process-redact-pii.js')
jest.mock('./application/process-reminder-email.js')

describe('Process Message test', () => {
  const sessionId = '8e5b5789-dad5-4f16-b4dc-bf6db90ce090'
  const receiver = {
    completeMessage: jest.fn(),
    abandonMessage: jest.fn()
  }
  const mockDb = {}
  const mockLogger = {
    warn: jest.fn()
  }

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test(`${moveClaimToPaidMsgType} message calls setPaymentStatusToPaid`, async () => {
    const message = {
      messageId: '1234567890',
      body: {
        claimRef: 'FUBC-1234-5678',
        sbi: '123456789'
      },
      applicationProperties: {
        type: moveClaimToPaidMsgType
      },
      sessionId
    }

    await processApplicationMessage(message, receiver, mockDb, mockLogger)

    expect(setPaymentStatusToPaid).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })

  test(`${redactPiiRequestMsgType} message calls processRedactPiiRequest`, async () => {
    const message = {
      messageId: '1234567890',
      body: {
        requestDate: new Date()
      },
      applicationProperties: {
        type: redactPiiRequestMsgType
      },
      sessionId
    }

    await processApplicationMessage(message, receiver, mockDb, mockLogger)

    expect(processRedactPiiRequest).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })

  test(`${reminderEmailRequestMsgType} message calls processReminderEmailRequest`, async () => {
    const message = {
      messageId: '1234567890',
      body: {
        requestDate: new Date()
      },
      applicationProperties: {
        type: reminderEmailRequestMsgType
      },
      sessionId
    }

    await processApplicationMessage(message, receiver, mockDb, mockLogger)

    expect(processReminderEmailRequest).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })

  test('unknown message calls nothing', async () => {
    const message = {
      messageId: '1234567890',
      body: {
        requestDate: new Date()
      },
      applicationProperties: {
        type: 'unknown'
      },
      sessionId
    }

    await processApplicationMessage(message, receiver, mockDb, mockLogger)

    expect(mockLogger.warn).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })
})
