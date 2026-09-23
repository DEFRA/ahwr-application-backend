import { applicationDataUpdateEvent } from './application-data-update-event.js'

const mockPublishEvent = jest.fn()

jest.mock('../messaging/fcp-messaging-service.js', () => ({
  getFcpEventPublisher: () => ({
    publishEvent: mockPublishEvent
  })
}))

describe('Application Data Update Event', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  test('should send expected event for updated application data', async () => {
    const eventDate = new Date()
    const eventData = {
      applicationReference: 'AHWR-1234-ABCD',
      reference: 'AHWR-1234-ABCD',
      newValue: 'updated',
      oldValue: 'original',
      updatedProperty: 'createdAt',
      note: 'changed createdAt'
    }

    await applicationDataUpdateEvent(
      eventData,
      'application-startDate',
      'admin',
      eventDate,
      '123456789'
    )

    expect(mockPublishEvent).toHaveBeenCalledWith({
      name: 'send-session-event',
      data: eventData,
      message: 'Application data updated',
      raisedBy: 'admin',
      raisedOn: eventDate.toISOString(),
      type: 'application-startDate',
      checkpoint: 'ahwr-application-backend',
      cph: 'n/a',
      id: expect.any(String),
      sbi: '123456789',
      status: 'success'
    })
  })
})
