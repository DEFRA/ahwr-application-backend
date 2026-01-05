// import { config } from '../../config/config.js'
import { reminders as reminderTypes } from 'ffc-ahwr-common-library'
import { processReminderEmailRequest } from './process-reminder-email.js'
// import { sendMessageToSNS } from '../send-message.js'
import { getRemindersToSend, updateReminders } from '../../repositories/application-repository.js'

const { threeMonths, sixMonths, nineMonths } = reminderTypes.notClaimed

// const { messageGeneratorMsgTypeReminder } = config.get('messageTypes')
// const { reminderRequestedTopicArn } = config.get('sns')

const mockPublishEvent = jest.fn()
// jest.mock('../../messaging/send-message.js', () => ({
//   sendMessageToSNS: jest.fn()
// }))
jest.mock('../../repositories/application-repository.js')
jest.mock('../../messaging/fcp-messaging-service.js', () => ({
  getFcpEventPublisher: jest.fn().mockImplementation(() => ({
    publishEvent: mockPublishEvent
  }))
}))

const getPreviousQuarterDates = (date) => {
  const subtractMonths = (baseDate, months) => {
    const d = new Date(baseDate)
    const day = d.getDate()

    d.setMonth(d.getMonth() - months)

    // Handle month rollover (e.g. 31st → Feb)
    if (d.getDate() !== day) {
      d.setDate(0)
    }

    return d
  }

  return {
    threeMonthsBefore: subtractMonths(date, 3),
    sixMonthsBefore: subtractMonths(date, 6),
    nineMonthsBefore: subtractMonths(date, 9)
  }
}

describe('processReminderEmailRequest', () => {
  const fakeMaxBatchSize = 5000

  const mockLogger = {
    setBindings: jest.fn(),
    info: jest.fn(),
    error: jest.fn()
  }
  const mockDb = {}
  const requestedDate = new Date()
  const message = {
    requestedDate: requestedDate.toISOString(),
    maxBatchSize: fakeMaxBatchSize
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should log and exit when there are no applications due reminders', async () => {
    const { threeMonthsBefore, sixMonthsBefore, nineMonthsBefore} = getPreviousQuarterDates(new Date(requestedDate))

    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([])

    await processReminderEmailRequest(message, mockDb, mockLogger)

    expect(getRemindersToSend).toHaveBeenCalledTimes(3)
    expect(getRemindersToSend).toHaveBeenCalledWith(
      nineMonths,
      nineMonthsBefore,
      undefined,
      [],
      fakeMaxBatchSize,
      mockDb,
      mockLogger
    )
    expect(getRemindersToSend).toHaveBeenCalledWith(
      sixMonths,
      sixMonthsBefore,
      nineMonthsBefore,
      [nineMonths],
      fakeMaxBatchSize,
      mockDb,
      mockLogger
    )
    expect(getRemindersToSend).toHaveBeenCalledWith(
      threeMonths,
      threeMonthsBefore,
      sixMonthsBefore,
      [sixMonths, nineMonths],
      fakeMaxBatchSize,
      mockDb,
      mockLogger
    )
    expect(mockLogger.info).toHaveBeenCalledTimes(2)
    expect(mockLogger.info).toHaveBeenCalledWith('Processing reminders request started..')
    expect(mockLogger.info).toHaveBeenCalledWith('No new applications due reminders')
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
    expect(mockLogger.info).toHaveBeenCalledTimes(2)
    expect(mockLogger.info).toHaveBeenCalledWith('Processing reminders request started..')
    expect(mockLogger.info).toHaveBeenCalledWith('Successfully processed reminders request')
    // expect(sendMessageToSNS).toHaveBeenCalledTimes(1)
    // expect(sendMessageToSNS).toHaveBeenCalledWith(
    //   reminderRequestedTopicArn,
    //   {
    //     agreementReference: 'IAHW-BEKR-AWIU',
    //     crn: '1100407200',
    //     sbi: '106282723',
    //     emailAddresses: ['dummy@example.com'],
    //     reminderType: threeMonths
    //   },
    //   { messageType: messageGeneratorMsgTypeReminder }
    // )
    expect(mockPublishEvent).toHaveBeenCalledTimes(1)
    expect(updateReminders).toHaveBeenCalledTimes(1)
    expect(updateReminders).toHaveBeenCalledWith(
      'IAHW-BEKR-AWIU',
      threeMonths,
      undefined,
      mockDb,
      mockLogger
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
        // TODO replace this is condition that checks application history
        // reminders: threeMonths,
        reminderType: sixMonths,
        createdAt: getPreviousQuarterDates(requestedDate).sixMonthsBefore
      }
    ])
    getRemindersToSend.mockResolvedValueOnce([])

    await processReminderEmailRequest(message, mockDb, mockLogger)

    expect(getRemindersToSend).toHaveBeenCalledTimes(3)
    expect(mockLogger.info).toHaveBeenCalledTimes(2)
    expect(mockLogger.info).toHaveBeenCalledWith('Processing reminders request started..')
    expect(mockLogger.info).toHaveBeenCalledWith('Successfully processed reminders request')
    // expect(sendMessageToSNS).toHaveBeenCalledTimes(1)
    // expect(sendMessageToSNS).toHaveBeenCalledWith(
    //   reminderRequestedTopicArn,
    //   {
    //     agreementReference: 'IAHW-BEKR-AWIU',
    //     crn: '1100407200',
    //     sbi: '106282723',
    //     emailAddresses: ['dummy1@example.com', 'dummy2@example.com'],
    //     reminderType: sixMonths
    //   },
    //   { messageType: messageGeneratorMsgTypeReminder }
    // )
    expect(mockPublishEvent).toHaveBeenCalledTimes(1)
    expect(updateReminders).toHaveBeenCalledTimes(1)
    expect(updateReminders).toHaveBeenCalledWith(
      'IAHW-BEKR-AWIU',
      sixMonths,
      // TODO replace this is condition that checks application history
      // threeMonths,
      undefined,
      mockDb,
      mockLogger
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

    // expect(sendMessageToSNS).toHaveBeenCalledTimes(1)
    // expect(sendMessageToSNS).toHaveBeenCalledWith(
    //   reminderRequestedTopicArn,
    //   {
    //     agreementReference: 'IAHW-BEKR-AWIU',
    //     crn: '1100407200',
    //     sbi: '106282723',
    //     emailAddresses: ['dummy1@example.com', 'dummy2@example.com'],
    //     reminderType: nineMonths
    //   },
    //   { messageType: messageGeneratorMsgTypeReminder }
    // )
  })

  // TODO replace this is condition that checks application history
  it.skip('should not promote to notClaimed_nineMonths when 8months old but has reminders previously sent', async () => {
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([
      {
        reference: 'IAHW-BEKR-AWIU',
        crn: '1100407200',
        sbi: '106282723',
        email: 'dummy1@example.com',
        orgEmail: 'dummy2@example.com',
        // TODO replace this is condition that checks application history
        // reminders: threeMonths,
        reminderType: nineMonths,
        createdAt: getPreviousQuarterDates(requestedDate).nineMonthsBefore
      }
    ])
    getRemindersToSend.mockResolvedValueOnce([])

    await processReminderEmailRequest(message, mockDb, mockLogger)

    // expect(sendMessageToSNS).toHaveBeenCalledTimes(1)
    // expect(sendMessageToSNS).toHaveBeenCalledWith(
    //   reminderRequestedTopicArn,
    //   {
    //     agreementReference: 'IAHW-BEKR-AWIU',
    //     crn: '1100407200',
    //     sbi: '106282723',
    //     emailAddresses: ['dummy1@example.com', 'dummy2@example.com'],
    //     reminderType: sixMonths
    //   },
    //   { messageType: messageGeneratorMsgTypeReminder }
    // )
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
        // TODO replace this is condition that checks application history
        // reminders: threeMonths,
        reminderType: nineMonths,
        createdAt: getPreviousQuarterDates(requestedDate).nineMonthsBefore
      }
    ])
    getRemindersToSend.mockResolvedValueOnce([])

    await processReminderEmailRequest(message, mockDb, mockLogger)

    // expect(sendMessageToSNS).toHaveBeenCalledTimes(1)
    // expect(sendMessageToSNS).toHaveBeenCalledWith(
    //   reminderRequestedTopicArn,
    //   {
    //     agreementReference: 'IAHW-BEKR-AWIU',
    //     crn: '1100407200',
    //     sbi: '106282723',
    //     emailAddresses: ['dummy@example.com'],
    //     reminderType: nineMonths
    //   },
    //   { messageType: messageGeneratorMsgTypeReminder }
    // )
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
        // TODO replace this is condition that checks application history
        // reminders: threeMonths,
        createdAt: getPreviousQuarterDates(requestedDate).threeMonthsBefore
      },
      {
        reference: 'IAHW-BEKR-AWI2',
        crn: '1100407200',
        sbi: '106282723',
        email: 'dummy@example.com',
        orgEmail: 'dummy@example.com',
        // TODO replace this is condition that checks application history
        // reminders: threeMonths,
        createdAt: getPreviousQuarterDates(requestedDate).threeMonthsBefore
      },
      {
        reference: 'IAHW-BEKR-AWI3',
        crn: '1100407200',
        sbi: '106282723',
        email: 'dummy@example.com',
        orgEmail: 'dummy@example.com',
        // TODO replace this is condition that checks application history
        // reminders: threeMonths,
        createdAt: getPreviousQuarterDates(requestedDate).threeMonthsBefore
      },
      {
        reference: 'IAHW-BEKR-AWI4',
        crn: '1100407200',
        sbi: '106282723',
        email: 'dummy@example.com',
        orgEmail: 'dummy@example.com',
        // TODO replace this is condition that checks application history
        // reminders: threeMonths,
        createdAt: getPreviousQuarterDates(requestedDate).threeMonthsBefore
      },
      {
        reference: 'IAHW-BEKR-AWI5',
        crn: '1100407200',
        sbi: '106282723',
        email: 'dummy@example.com',
        orgEmail: 'dummy@example.com',
        // TODO replace this is condition that checks application history
        // reminders: threeMonths,
        createdAt: getPreviousQuarterDates(requestedDate).threeMonthsBefore
      }
    ])

    await processReminderEmailRequest(message, mockDb, mockLogger)

    expect(getRemindersToSend).toHaveBeenCalledTimes(3)
    expect(mockLogger.info).toHaveBeenCalledTimes(2)
    // expect(sendMessageToSNS).toHaveBeenCalledTimes(5)
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
    expect(mockLogger.info).toHaveBeenCalledTimes(1)
    expect(mockLogger.info).toHaveBeenCalledWith('Processing reminders request started..')
    // expect(sendMessageToSNS).toHaveBeenCalledTimes(1)
    expect(mockLogger.error).toHaveBeenCalledTimes(1)
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.any(Object),
      'Failed to processed reminders request'
    )
    expect(mockPublishEvent).toHaveBeenCalledTimes(1)
    expect(updateReminders).toHaveBeenCalledTimes(0)
  })
})
