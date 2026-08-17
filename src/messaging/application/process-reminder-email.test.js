import { reminders as reminderTypes } from 'ffc-ahwr-common-library'
import { processReminderEmailRequest } from './process-reminder-email.js'
import { getRemindersToSend, updateReminders } from '../../repositories/application-repository.js'

const { threeMonths, sixMonths, nineMonths } = reminderTypes.notClaimed

const mockPublishEvent = jest.fn()
jest.mock('../../repositories/application-repository.js')
jest.mock('../../messaging/fcp-messaging-service.js', () => ({
  getFcpEventPublisher: jest.fn().mockImplementation(() => ({
    publishEvent: mockPublishEvent
  }))
}))

const subtractMonthsUTC = (date, months) => {
  const d = new Date(date) // clone to avoid mutating original
  const year = d.getUTCFullYear()
  const month = d.getUTCMonth()

  d.setUTCFullYear(year, month - months)

  return d
}

const getPreviousQuarterDates = (date) => ({
  threeMonthsBefore: subtractMonthsUTC(date, 3),
  sixMonthsBefore: subtractMonthsUTC(date, 6),
  nineMonthsBefore: subtractMonthsUTC(date, 9)
})

describe('processReminderEmailRequest', () => {
  const fakeMaxBatchSize = 5000

  const childLogger = {
    info: jest.fn(),
    error: jest.fn()
  }
  const mockLogger = {
    child: jest.fn(() => childLogger)
  }
  const mockDb = {}

  const requestedDate = new Date('2025-11-05T00:00:00.000Z')
  jest.useFakeTimers().setSystemTime(requestedDate)
  const message = {
    requestedDate: requestedDate.toISOString(),
    maxBatchSize: fakeMaxBatchSize
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('should log and exit when there are no applications due reminders', async () => {
    const { threeMonthsBefore, sixMonthsBefore, nineMonthsBefore } =
      getPreviousQuarterDates(requestedDate)

    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([])

    await processReminderEmailRequest(message, mockDb, mockLogger)

    expect(mockLogger.child).toHaveBeenCalledWith({ requestedDate: message.requestedDate })
    expect(getRemindersToSend).toHaveBeenCalledTimes(3)
    expect(getRemindersToSend.mock.calls[0][1].toISOString()).toBe(nineMonthsBefore.toISOString())
    expect(getRemindersToSend.mock.calls[1][1].toISOString()).toBe(sixMonthsBefore.toISOString())
    expect(getRemindersToSend.mock.calls[2][1].toISOString()).toBe(threeMonthsBefore.toISOString())

    expect(childLogger.info).toHaveBeenCalledTimes(2)
    expect(childLogger.info).toHaveBeenCalledWith('Processing reminders request started..')
    expect(childLogger.info).toHaveBeenCalledWith('No new applications due reminders')
    expect(mockPublishEvent).toHaveBeenCalledTimes(0)
    expect(updateReminders).toHaveBeenCalledTimes(0)
  })

  it('should send to message-generator and update reminders for application when first reminder due', async () => {
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([
      {
        reference: 'IAHW-BEKR-AWIU',
        crn: '1100407200',
        sbi: '106282723',
        email: 'dummy@example.com',
        orgEmail: undefined,
        reminderType: threeMonths,
        createdAt: getPreviousQuarterDates(requestedDate).threeMonthsBefore
      }
    ])

    await processReminderEmailRequest(message, mockDb, mockLogger)

    expect(getRemindersToSend).toHaveBeenCalledTimes(3)
    expect(childLogger.info).toHaveBeenCalledTimes(2)
    expect(childLogger.info).toHaveBeenCalledWith('Processing reminders request started..')
    expect(childLogger.info).toHaveBeenCalledWith('Successfully processed reminders request')
    expect(mockPublishEvent).toHaveBeenCalledTimes(1)
    expect(updateReminders).toHaveBeenCalledTimes(1)
    expect(updateReminders).toHaveBeenCalledWith(
      'IAHW-BEKR-AWIU',
      threeMonths,
      undefined,
      mockDb,
      childLogger
    )
  })

  it('should send notClaimed_sixMonths to two addresses when two email addresses and notClaimed_threeMonths already sent', async () => {
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([
      {
        reference: 'IAHW-BEKR-AWIU',
        crn: '1100407200',
        sbi: '106282723',
        email: 'dummy1@example.com',
        orgEmail: 'dummy2@example.com',
        reminderType: sixMonths,
        createdAt: getPreviousQuarterDates(requestedDate).sixMonthsBefore
      }
    ])
    getRemindersToSend.mockResolvedValueOnce([])

    await processReminderEmailRequest(message, mockDb, mockLogger)

    expect(getRemindersToSend).toHaveBeenCalledTimes(3)
    expect(childLogger.info).toHaveBeenCalledTimes(2)
    expect(childLogger.info).toHaveBeenCalledWith('Processing reminders request started..')
    expect(childLogger.info).toHaveBeenCalledWith('Successfully processed reminders request')
    expect(mockPublishEvent).toHaveBeenCalledTimes(1)
    expect(updateReminders).toHaveBeenCalledTimes(1)
    expect(updateReminders).toHaveBeenCalledWith(
      'IAHW-BEKR-AWIU',
      sixMonths,
      undefined,
      mockDb,
      childLogger
    )
  })

  it('should promote to notClaimed_nineMonths when 8months old and no reminders previously sent', async () => {
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([
      {
        reference: 'IAHW-BEKR-AWIU',
        crn: '1100407200',
        sbi: '106282723',
        email: 'dummy1@example.com',
        orgEmail: 'dummy2@example.com',
        reminderType: nineMonths,
        createdAt: getPreviousQuarterDates(requestedDate).nineMonthsBefore
      }
    ])
    getRemindersToSend.mockResolvedValueOnce([])

    await processReminderEmailRequest(message, mockDb, mockLogger)

    expect(mockPublishEvent).toHaveBeenCalledTimes(1)
    expect(updateReminders).toHaveBeenCalledWith(
      'IAHW-BEKR-AWIU',
      nineMonths,
      undefined,
      mockDb,
      childLogger
    )
  })

  // Unskip once the reminder history tracking is in place. Currently we do
  // not record the history of reminders
  it.skip('should not promote to notClaimed_nineMonths when 8months old but has reminders previously sent', async () => {
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([
      {
        reference: 'IAHW-BEKR-AWIU',
        crn: '1100407200',
        sbi: '106282723',
        email: 'dummy1@example.com',
        orgEmail: 'dummy2@example.com',
        reminderType: nineMonths,
        createdAt: getPreviousQuarterDates(requestedDate).nineMonthsBefore
      }
    ])
    getRemindersToSend.mockResolvedValueOnce([])

    await processReminderEmailRequest(message, mockDb, mockLogger)

    expect(mockPublishEvent).toHaveBeenCalledTimes(1)
    expect(updateReminders).toHaveBeenCalledWith(
      'IAHW-BEKR-AWIU',
      sixMonths,
      undefined,
      mockDb,
      childLogger
    )
  })

  it('should only send to one address when email and orgEmail are the same', async () => {
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([
      {
        reference: 'IAHW-BEKR-AWIU',
        crn: '1100407200',
        sbi: '106282723',
        email: 'dummy@example.com',
        orgEmail: 'dummy@example.com',
        reminderType: nineMonths,
        createdAt: getPreviousQuarterDates(requestedDate).nineMonthsBefore
      }
    ])
    getRemindersToSend.mockResolvedValueOnce([])

    await processReminderEmailRequest(message, mockDb, mockLogger)

    expect(mockPublishEvent).toHaveBeenCalledTimes(1)
    expect(updateReminders).toHaveBeenCalledWith(
      'IAHW-BEKR-AWIU',
      nineMonths,
      undefined,
      mockDb,
      childLogger
    )
  })

  it('should send to message-generator and update reminders for multiple applications when multiple reminders due', async () => {
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([
      {
        reference: 'IAHW-BEKR-AWI1',
        crn: '1100407200',
        sbi: '106282723',
        email: 'dummy@example.com',
        orgEmail: 'dummy@example.com',
        createdAt: getPreviousQuarterDates(requestedDate).threeMonthsBefore
      },
      {
        reference: 'IAHW-BEKR-AWI2',
        crn: '1100407200',
        sbi: '106282723',
        email: 'dummy@example.com',
        orgEmail: 'dummy@example.com',
        createdAt: getPreviousQuarterDates(requestedDate).threeMonthsBefore
      },
      {
        reference: 'IAHW-BEKR-AWI3',
        crn: '1100407200',
        sbi: '106282723',
        email: 'dummy@example.com',
        orgEmail: 'dummy@example.com',
        createdAt: getPreviousQuarterDates(requestedDate).threeMonthsBefore
      },
      {
        reference: 'IAHW-BEKR-AWI4',
        crn: '1100407200',
        sbi: '106282723',
        email: 'dummy@example.com',
        orgEmail: 'dummy@example.com',
        createdAt: getPreviousQuarterDates(requestedDate).threeMonthsBefore
      },
      {
        reference: 'IAHW-BEKR-AWI5',
        crn: '1100407200',
        sbi: '106282723',
        email: 'dummy@example.com',
        orgEmail: 'dummy@example.com',
        createdAt: getPreviousQuarterDates(requestedDate).threeMonthsBefore
      }
    ])

    await processReminderEmailRequest(message, mockDb, mockLogger)

    expect(getRemindersToSend).toHaveBeenCalledTimes(3)
    expect(childLogger.info).toHaveBeenCalledTimes(2)
    expect(mockPublishEvent).toHaveBeenCalledTimes(5)
    expect(updateReminders).toHaveBeenCalledTimes(5)
  })

  it('should log error and exit processing to allow message retry when fail send message-generator', async () => {
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([
      {
        reference: 'IAHW-BEKR-AWIU',
        crn: '1100407200',
        sbi: '106282723',
        email: 'dummy@example.com',
        orgEmail: undefined,
        createdAt: getPreviousQuarterDates(requestedDate).threeMonthsBefore
      }
    ])
    mockPublishEvent.mockRejectedValueOnce(new Error('Faild to send message!'))

    await expect(processReminderEmailRequest(message, mockDb, mockLogger)).rejects.toThrow()

    expect(getRemindersToSend).toHaveBeenCalledTimes(3)
    expect(childLogger.info).toHaveBeenCalledTimes(1)
    expect(childLogger.info).toHaveBeenCalledWith('Processing reminders request started..')
    expect(childLogger.error).toHaveBeenCalledTimes(1)
    expect(childLogger.error).toHaveBeenCalledWith(
      expect.any(Object),
      'Failed to processed reminders request'
    )
    expect(mockPublishEvent).toHaveBeenCalledTimes(1)
    expect(updateReminders).toHaveBeenCalledTimes(0)
  })
})
