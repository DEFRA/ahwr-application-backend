import { setupTestEnvironment, teardownTestEnvironment } from '../test-utils.js'
import { config } from '../../../src/config/config.js'
import { StatusCodes } from 'http-status-codes'

describe('Search applications', () => {
  let server
  let options

  beforeAll(async () => {
    server = await setupTestEnvironment()
    options = {
      method: 'POST',
      url: '/api/applications/search',
      headers: { 'x-api-key': config.get('apiKeys.backofficeUiApiKey') }
    }
  })

  beforeEach(async () => {
    await server.db.collection('applications').deleteMany({})
    await server.db.collection('owapplications').deleteMany({})

    await server.db.collection('applications').insertOne({
      reference: 'IAHW-AAAA-0001',
      status: 'AGREED',
      createdAt: new Date('2026-03-15T00:00:00.000Z'),
      organisation: { sbi: '111111111', name: 'IAHW New World In Range' },
      flags: []
    })

    await server.db.collection('owapplications').insertOne({
      reference: 'AHWR-BBBB-0002',
      status: 'READY_TO_PAY',
      createdAt: new Date('2026-04-01T00:00:00.000Z'),
      organisation: { sbi: '222222222', name: 'IAHW Old World In Range' },
      flags: []
    })

    await server.db.collection('applications').insertOne({
      reference: 'POUL-CCCC-0003',
      status: 'AGREED',
      createdAt: new Date('2026-03-20T00:00:00.000Z'),
      organisation: { sbi: '333333333', name: 'PBR In Range' },
      flags: []
    })

    await server.db.collection('applications').insertOne({
      reference: 'IAHW-DDDD-0004',
      status: 'AGREED',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      organisation: { sbi: '444444444', name: 'IAHW Outside Range' },
      flags: []
    })

    await server.db.collection('applications').insertOne({
      reference: 'POUL-EEEE-0005',
      status: 'AGREED',
      createdAt: new Date('2025-06-01T00:00:00.000Z'),
      organisation: { sbi: '555555555', name: 'PBR Outside Range' },
      flags: []
    })

    await server.db.collection('applications').insertOne({
      reference: 'IAHW-FFFF-0006',
      status: 'AGREED',
      createdAt: new Date('2025-09-01T00:00:00.000Z'),
      organisation: { sbi: '666666666', name: 'IAHW Flagged' },
      flags: [{ id: 'flag-1', deleted: false }]
    })

    await server.db.collection('applications').insertOne({
      reference: 'IAHW-GGGG-0007',
      status: 'AGREED',
      createdAt: new Date('2025-09-02T00:00:00.000Z'),
      organisation: { sbi: '777777777', name: 'IAHW Only Deleted Flag' },
      flags: [{ id: 'flag-2', deleted: true }]
    })
  })

  afterAll(async () => {
    await teardownTestEnvironment()
  })

  const searchPayload = (overrides) => ({
    search: { text: '', type: '' },
    limit: 20,
    offset: 0,
    ...overrides
  })

  const references = (body) =>
    JSON.parse(body)
      .applications.map((a) => a.reference)
      .sort()

  test('applies agreementType and date range together as AND, across both collections', async () => {
    const res = await server.inject({
      ...options,
      payload: searchPayload({
        agreementType: 'IAHW',
        dateFrom: new Date('2026-01-01T00:00:00.000Z'),
        dateTo: new Date('2026-06-30T23:59:59.999Z')
      })
    })

    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(JSON.parse(res.payload).total).toBe(2)
    expect(references(res.payload)).toEqual(['AHWR-BBBB-0002', 'IAHW-AAAA-0001'])
  })

  test('PBR returns only poultry agreements, regardless of date', async () => {
    const res = await server.inject({
      ...options,
      payload: searchPayload({ agreementType: 'PBR' })
    })

    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(references(res.payload)).toEqual(['POUL-CCCC-0003', 'POUL-EEEE-0005'])
  })

  test('FLAGGED returns only applications with a non-deleted flag', async () => {
    const res = await server.inject({
      ...options,
      payload: searchPayload({ flag: 'FLAGGED' })
    })

    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(references(res.payload)).toEqual(['IAHW-FFFF-0006'])
  })

  test('NOT_FLAGGED treats empty and only-deleted flags as not flagged', async () => {
    const res = await server.inject({
      ...options,
      payload: searchPayload({ flag: 'NOT_FLAGGED' })
    })

    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(references(res.payload)).toEqual([
      'AHWR-BBBB-0002',
      'IAHW-AAAA-0001',
      'IAHW-DDDD-0004',
      'IAHW-GGGG-0007',
      'POUL-CCCC-0003',
      'POUL-EEEE-0005'
    ])
  })

  test('ALL returns flagged and unflagged applications', async () => {
    const res = await server.inject({
      ...options,
      payload: searchPayload({ flag: 'ALL' })
    })

    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(JSON.parse(res.payload).total).toBe(7)
  })
})
