import { processOnHoldClaims } from './process-on-hold.js'
import { findOnHoldClaims, updateClaimStatuses } from '../repositories/claim-repository.js'
import { getLogger } from '../logging/logger.js'
import { STATUS } from 'ffc-ahwr-common-library'

jest.mock('../repositories/claim-repository.js')
jest.mock('../logging/logger.js')

describe('processOnHoldClaims', () => {
  let mockDb
  let mockInfo

  beforeEach(() => {
    jest.resetAllMocks()
    mockDb = {}
    mockInfo = jest.fn()
    getLogger.mockReturnValue({ info: mockInfo })
  })

  it('moves claims from on hold to ready to pay when there are on hold claims', async () => {
    const fakeClaims = [{ reference: 'REBC-DJ32-LDNF' }, { reference: 'FUSH-HD33-P99I' }]
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
