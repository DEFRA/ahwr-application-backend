import { claimDataUpdateEvent } from './claim-data-update-event.js'

const mockPublishEvent = jest.fn()

jest.mock('../messaging/fcp-messaging-service.js', () => ({
  getEventPublisher: () => ({
    publishEvent: mockPublishEvent
  })
}))

describe('Claim Data Update Event', () => {
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
      updatedProperty: 'vetRCVSNumber',
      note: 'changed vetRCVSNumber'
    }

    await claimDataUpdateEvent(
      eventData,
      'application-vetName',
      'admin',
      eventDate,
      '123456789'
    )

    expect(mockPublishEvent).toHaveBeenCalledWith({
      name: 'send-session-event',
      data: eventData,
      message: 'Application Claim data updated',
      raisedBy: 'admin',
      raisedOn: eventDate.toISOString(),
      type: 'claim-vetName',
      checkpoint: 'ahwr-application-backend',
      cph: 'n/a',
      id: expect.any(String),
      sbi: '123456789',
      status: 'success'
    })
  })

  test('should send expected event for updated claim data', async () => {
    const eventDate = new Date()
    const eventData = {
      applicationReference: 'IAHW-1234-ABCD',
      reference: 'REBC-1234-WXYZ',
      newValue: 'updated',
      oldValue: 'original',
      updatedProperty: 'vetRCVSNumber',
      note: 'changed vetRCVSNumber'
    }

    await claimDataUpdateEvent(
      eventData,
      'claim-vetRcvs',
      'admin',
      eventDate,
      '123456789'
    )

    expect(mockPublishEvent).toHaveBeenCalledWith({
      name: 'send-session-event',
      data: eventData,
      message: 'Claim data updated',
      raisedBy: 'admin',
      raisedOn: eventDate.toISOString(),
      type: 'claim-vetRcvs',
      checkpoint: 'ahwr-application-backend',
      cph: 'n/a',
      id: expect.any(String),
      sbi: '123456789',
      status: 'success'
    })
  })
})
