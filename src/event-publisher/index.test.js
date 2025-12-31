import {
  raiseApplicationFlaggedEvent,
  raiseApplicationStatusEvent,
  raiseClaimEvents,
  raiseHerdEvent,
  SEND_SESSION_EVENT
} from './index.js'
import { getFcpEventPublisher } from '../messaging/fcp-messaging-service.js'

jest.mock('../messaging/fcp-messaging-service.js')
jest.mock('../config/config.js', () => ({
  config: { get: jest.fn().mockReturnValue('TEST_SERVICE') }
}))

describe('FCP Event Raising Functions', () => {
  const publishEventMock = jest.fn()

  beforeEach(() => {
    jest.resetAllMocks()
    getFcpEventPublisher.mockReturnValue({ publishEvent: publishEventMock })
  })

  it('raiseApplicationStatusEvent calls publishEvent with correct payload', async () => {
    const event = {
      application: { id: 'app1', organisation: { sbi: '123' }, status: 'READY', reference: 'REF1' },
      message: 'App status updated',
      raisedBy: 'tester',
      raisedOn: new Date('2025-12-30T12:00:00Z')
    }

    await raiseApplicationStatusEvent(event)

    expect(publishEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: SEND_SESSION_EVENT,
        id: 'app1',
        sbi: '123',
        checkpoint: 'TEST_SERVICE',
        status: 'success',
        type: 'application:status-updated:READY',
        message: 'App status updated',
        data: { reference: 'REF1', status: 'READY' },
        raisedBy: 'tester',
        raisedOn: '2025-12-30T12:00:00.000Z'
      })
    )
  })

  it('raiseClaimEvents calls publishEvent with correct payload and custom sbi', async () => {
    const event = {
      claim: { id: 'claim1', reference: 'CREF1', applicationReference: 'AREF1', status: 'ON_HOLD' },
      message: 'Claim updated',
      raisedBy: 'tester',
      raisedOn: new Date('2025-12-30T12:00:00Z')
    }

    await raiseClaimEvents(event, '999')

    expect(publishEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: SEND_SESSION_EVENT,
        id: 'claim1',
        sbi: '999',
        checkpoint: 'TEST_SERVICE',
        status: 'success',
        type: 'application:status-updated:ON_HOLD',
        message: 'Claim updated',
        data: { reference: 'CREF1', applicationReference: 'AREF1', status: 'ON_HOLD' },
        raisedBy: 'tester',
        raisedOn: '2025-12-30T12:00:00.000Z'
      })
    )
  })

  it('raiseApplicationFlaggedEvent calls publishEvent with a UUID id', async () => {
    const event = {
      flag: { id: 'FLAG1', note: 'Important', appliesToMh: true },
      applicationReference: 'AREF1',
      message: 'Application flagged',
      raisedBy: 'tester',
      raisedOn: new Date('2025-12-30T12:00:00Z')
    }

    await raiseApplicationFlaggedEvent(event, '555')

    expect(publishEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        sbi: '555',
        type: 'application-flagged',
        data: expect.objectContaining({
          flagId: 'FLAG1',
          flagDetail: 'Important',
          flagAppliesToMh: true,
          applicationReference: 'AREF1'
        }),
        raisedBy: 'tester',
        raisedOn: '2025-12-30T12:00:00.000Z'
      })
    )
  })

  it('raiseHerdEvent calls publishEvent with admin as raisedBy', async () => {
    const eventData = {
      herdId: 'H1',
      message: 'Herd updated',
      data: { key: 'val' },
      type: 'herd-update',
      sbi: '888'
    }

    const realDate = new Date('2025-12-30T12:00:00Z')
    jest.useFakeTimers().setSystemTime(realDate)

    await raiseHerdEvent(eventData)

    expect(publishEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        raisedBy: 'admin',
        raisedOn: realDate.toISOString(),
        sbi: '888',
        data: { key: 'val' },
        type: 'herd-update'
      })
    )

    jest.useRealTimers()
  })
})
