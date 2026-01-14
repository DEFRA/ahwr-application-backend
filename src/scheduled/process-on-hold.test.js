import { processOnHoldClaims } from './process-on-hold.js'
import {
  findOnHoldClaims,
  getClaimByReference,
  updateClaimStatuses
} from '../repositories/claim-repository.js'
import { getLogger } from '../logging/logger.js'
import { STATUS } from 'ffc-ahwr-common-library'
import { publishStatusChangeEvent } from '../messaging/publish-outbound-notification.js'
import { ObjectId } from 'mongodb'

jest.mock('../messaging/publish-outbound-notification.js')
jest.mock('../repositories/claim-repository.js')
jest.mock('../logging/logger.js')

describe('processOnHoldClaims', () => {
  let mockDb
  let mockInfo
  let mockError

  beforeEach(() => {
    jest.resetAllMocks()
    mockDb = {}
    mockInfo = jest.fn()
    mockError = jest.fn()
    getLogger.mockReturnValue({ error: mockError, info: mockInfo })
  })

  it('moves claims from on hold to ready to pay when there are on hold claims', async () => {
    const fakeClaims = [{ reference: 'REBC-DJ32-LDNF' }, { reference: 'FUSH-HD33-P99I' }]
    const claimsFromDb = [
      {
        applicationReference: 'IAHW-RWE2-G8S7',
        reference: 'REBC-DJ32-LDNF',
        status: 'READY_TO_PAY',
        type: 'REVIEW',
        data: { typeOfLivestock: 'beef' },
        herd: { name: 'Beefers' },
        _id: new ObjectId('507f191e810c19729de860ea')
      },
      {
        applicationReference: 'IAHW-RWE2-G8S7',
        reference: 'FUSH-HD33-P99I',
        status: 'READY_TO_PAY',
        type: 'REVIEW',
        data: { typeOfLivestock: 'beef' },
        herd: { name: 'Beefers' },
        _id: new ObjectId('507f191e810c19729de860ea')
      }
    ]
    getClaimByReference.mockResolvedValueOnce(claimsFromDb[0])
    getClaimByReference.mockResolvedValueOnce(claimsFromDb[1])

    findOnHoldClaims.mockResolvedValue(fakeClaims)
    updateClaimStatuses.mockResolvedValue({ updatedRecordCount: 2 })

    await processOnHoldClaims(mockDb)

    expect(findOnHoldClaims).toHaveBeenCalledWith(expect.objectContaining({ db: mockDb }))
    expect(updateClaimStatuses).toHaveBeenCalledWith(
      expect.objectContaining({
        db: mockDb,
        references: [fakeClaims[0].reference, fakeClaims[1].reference],
        status: STATUS.READY_TO_PAY,
        user: 'admin',
        updatedAt: expect.any(Date)
      })
    )

    expect(publishStatusChangeEvent).toHaveBeenCalledWith(
      { error: mockError, info: mockInfo },
      {
        //sbi: where it should come from?
        agreementReference: claimsFromDb[0].applicationReference,
        claimReference: claimsFromDb[0].reference,
        claimStatus: 'READY_TO_PAY',
        claimType: claimsFromDb[0].type,
        dateTime: expect.any(Date),
        herdName: claimsFromDb[0].herd.name,
        typeOfLivestock: claimsFromDb[0].data.typeOfLivestock
      }
    )

    expect(publishStatusChangeEvent).toHaveBeenCalledWith(
      { error: mockError, info: mockInfo },
      {
        //sbi: where it should come from?
        agreementReference: claimsFromDb[1].applicationReference,
        claimReference: claimsFromDb[1].reference,
        claimStatus: 'READY_TO_PAY',
        claimType: claimsFromDb[1].type,
        dateTime: expect.any(Date),
        herdName: claimsFromDb[1].herd.name,
        typeOfLivestock: claimsFromDb[1].data.typeOfLivestock
      }
    )

    expect(mockInfo).toHaveBeenCalledWith('Of 2 claims on hold, 2 updated to ready to pay.')
  })

  it('does nothing when there are no hold claims', async () => {
    const fakeClaims = []
    findOnHoldClaims.mockResolvedValue(fakeClaims)

    await processOnHoldClaims(mockDb)

    expect(findOnHoldClaims).toHaveBeenCalledWith(expect.objectContaining({ db: mockDb }))
    expect(updateClaimStatuses).not.toHaveBeenCalled()
    expect(mockInfo).toHaveBeenCalledWith('No claims to move from on hold to ready to pay.')
  })
})
