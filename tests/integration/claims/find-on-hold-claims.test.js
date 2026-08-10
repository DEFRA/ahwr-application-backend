import { setupTestEnvironment, teardownTestEnvironment } from '../test-utils.js'
import { findOnHoldClaims } from '../../../src/repositories/claim-repository.js'
import { STATUS } from 'ffc-ahwr-common-library'

// The auto-payment job only ever acts on the claims returned here, so this
// proves a non-ON_HOLD claim (e.g. WITHDRAWN) is never picked up for payment.
describe('findOnHoldClaims', () => {
  let server

  const beforeDate = new Date('2025-06-01T00:00:00.000Z')
  const aged = new Date('2025-05-01T00:00:00.000Z') // on or before beforeDate
  const recent = new Date('2025-07-01T00:00:00.000Z') // after beforeDate

  const claim = (reference, status, updatedAt) => ({
    reference,
    applicationReference: 'IAHW-G3CL-V59P',
    createdAt: new Date('2025-04-24T08:24:24.092Z'),
    updatedAt,
    createdBy: 'admin',
    type: 'REVIEW',
    data: { typeOfLivestock: 'beef' },
    status,
    statusHistory: [],
    herd: {},
    updateHistory: []
  })

  beforeAll(async () => {
    server = await setupTestEnvironment()
  })

  beforeEach(async () => {
    await server.db.collection('claims').deleteMany({})
    await server.db
      .collection('claims')
      .insertMany([
        claim('AGED-ONHD-0001', STATUS.ON_HOLD, aged),
        claim('AGED-ONHD-0002', STATUS.ON_HOLD, aged),
        claim('RCNT-ONHD-0003', STATUS.ON_HOLD, recent),
        claim('AGED-WTHD-0004', STATUS.WITHDRAWN, aged),
        claim('AGED-RTP0-0005', STATUS.READY_TO_PAY, aged),
        claim('AGED-PAID-0006', STATUS.PAID, aged),
        claim('AGED-INCK-0007', STATUS.IN_CHECK, aged)
      ])
  })

  afterAll(async () => {
    await teardownTestEnvironment()
  })

  test('returns only aged ON_HOLD claims, excluding every other status', async () => {
    const result = await findOnHoldClaims({ db: server.db, beforeDate })

    expect(result.map((c) => c.reference).sort()).toEqual(['AGED-ONHD-0001', 'AGED-ONHD-0002'])
    expect(result.every((c) => c.status === STATUS.ON_HOLD)).toBe(true)
  })

  test('does not return a WITHDRAWN claim even when it is aged', async () => {
    const result = await findOnHoldClaims({ db: server.db, beforeDate })

    const references = result.map((c) => c.reference)
    expect(references).not.toContain('AGED-WTHD-0004')
  })

  test('excludes ON_HOLD claims updated after beforeDate', async () => {
    const result = await findOnHoldClaims({ db: server.db, beforeDate })

    const references = result.map((c) => c.reference)
    expect(references).not.toContain('RCNT-ONHD-0003')
  })

  test('respects the limit', async () => {
    const result = await findOnHoldClaims({ db: server.db, beforeDate, limit: 1 })

    expect(result).toHaveLength(1)
    expect(result[0].status).toBe(STATUS.ON_HOLD)
  })
})
