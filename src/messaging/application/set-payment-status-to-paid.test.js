import {
  getClaimByReference,
  updateClaimStatus
} from '../../repositories/claim-repository'
import { publishStatusChangeEvent } from '../publish-outbound-notification'
import { setPaymentStatusToPaid } from './set-payment-status-to-paid'
import { raiseClaimEvents } from '../../event-publisher'

jest.mock('../../repositories/claim-repository')
jest.mock('../publish-outbound-notification')
jest.mock('../../event-publisher')

describe('handler function for setting payment status to paid for claims', () => {
  const mockLogger = { error: jest.fn(), info: jest.fn() }
  const mockDb = jest.fn()

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('happy path for a claim being updated to paid', async () => {
    const claimFromDb = {
      applicationReference: 'IAHW-RWE2-G8S7',
      reference: 'REBC-ABCD-1234',
      status: 'RECOMMENDED_TO_PAY',
      data: { claimType: 'R', typeOfLivestock: 'beef' },
      herd: { name: 'Beefers' }
    }
    getClaimByReference.mockResolvedValueOnce(claimFromDb)
    const updatedClaim = {
      ...claimFromDb,
      status: 'PAID',
      updatedBy: 'admin',
      updatedAt: new Date('2025-11-21T14:17:20.084Z'),
      statusHistory: [
        {
          status: 'PAID',
          createdAt: new Date('2025-11-21T14:17:20.084Z'),
          createdBy: 'admin'
        }
      ]
    }
    updateClaimStatus.mockResolvedValueOnce(updatedClaim)
    const message = { claimRef: 'REBC-ABCD-1234', sbi: '123456789' }

    await setPaymentStatusToPaid(message, mockDb, mockLogger)

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Setting payment status to paid for claim: REBC-ABCD-1234'
    )
    expect(updateClaimStatus).toHaveBeenCalledWith({
      db: mockDb,
      reference: 'REBC-ABCD-1234',
      status: 'PAID',
      user: 'admin',
      updatedAt: expect.any(Date)
    })
    expect(raiseClaimEvents).toHaveBeenCalledWith(
      {
        message: 'Claim has been updated',
        claim: updatedClaim,
        note: undefined,
        raisedBy: 'admin',
        raisedOn: new Date('2025-11-21T14:17:20.084Z')
      },
      message.sbi
    )
    expect(publishStatusChangeEvent).toHaveBeenCalledWith(mockLogger, {
      agreementReference: claimFromDb.applicationReference,
      claimReference: claimFromDb.reference,
      claimStatus: 'PAID',
      claimType: claimFromDb.data.claimType,
      dateTime: new Date('2025-11-21T14:17:20.084Z'),
      herdName: claimFromDb.herd.name,
      sbi: message.sbi,
      typeOfLivestock: claimFromDb.data.typeOfLivestock
    })
    expect(mockLogger.error).toHaveBeenCalledTimes(0)
  })

  test('validation fails because of incorrect message input', async () => {
    const message = { claimRef: 'REBC-ABCD-1234', sbi: 123456789 }

    await setPaymentStatusToPaid(message, mockDb, mockLogger)

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Claim status to paid validation error:')
    )
    expect(mockLogger.error).toHaveBeenCalledWith(
      `Failed to move claim to paid status: Invalid message in payment status to paid event: claimRef: ${message.claimRef} sbi: ${message.sbi}`
    )
    expect(publishStatusChangeEvent).not.toHaveBeenCalled()
  })

  test('happy path for a claim being updated to paid, but its herdless as it was for a preMH visit', async () => {
    const herdlessClaimFromDb = {
      applicationReference: 'IAHW-RWE2-G8S7',
      reference: 'REBC-ABCD-1234',
      status: 'RECOMMENDED_TO_PAY',
      data: { claimType: 'R', typeOfLivestock: 'beef' }
    }
    getClaimByReference.mockResolvedValueOnce(herdlessClaimFromDb)
    updateClaimStatus.mockResolvedValueOnce({
      ...herdlessClaimFromDb,
      status: 'PAID',
      updatedAt: new Date('2025-11-21T14:17:20.084Z')
    })
    const message = { claimRef: 'REBC-ABCD-1234', sbi: '123456789' }

    await setPaymentStatusToPaid(message, mockDb, mockLogger)

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Setting payment status to paid for claim: REBC-ABCD-1234'
    )
    expect(publishStatusChangeEvent).toHaveBeenCalledWith(mockLogger, {
      agreementReference: 'IAHW-RWE2-G8S7',
      claimReference: 'REBC-ABCD-1234',
      claimStatus: 'PAID',
      claimType: 'R',
      dateTime: new Date('2025-11-21T14:17:20.084Z'),
      herdName: 'Unnamed herd',
      sbi: '123456789',
      typeOfLivestock: 'beef'
    })
    expect(mockLogger.error).toHaveBeenCalledTimes(0)
  })
})
