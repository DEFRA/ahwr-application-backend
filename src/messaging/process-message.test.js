import { config } from '../config/config.js'
import { processApplicationMessage } from './process-message.js'
import { processReminderEmailRequest } from './application/process-reminder-email.js'

jest.mock('applicationinsights', () => ({
  defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() },
  dispose: jest.fn()
}))
jest.mock('./application/process-reminder-email.js')

const { reminderEmailRequestMsgType } = config

describe('Process Message test', () => {
  const sessionId = '8e5b5789-dad5-4f16-b4dc-bf6db90ce090'
  const receiver = {
    completeMessage: jest.fn(),
    abandonMessage: jest.fn()
  }
  const mockLogger = {
    warn: jest.fn()
  }

  beforeEach(async () => {
    jest.clearAllMocks()
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

    await processApplicationMessage(message, receiver, mockLogger)

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

    await processApplicationMessage(message, receiver, mockLogger)

    expect(mockLogger.warn).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })
})
