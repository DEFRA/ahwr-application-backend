import { setupTestEnvironment, teardownTestEnvironment } from '../test-utils.js'
import { config } from '../../../src/config/config.js'
import { StatusCodes } from 'http-status-codes'

describe('Search claims', () => {
  let server
  let options

  beforeAll(async () => {
    server = await setupTestEnvironment()
    options = {
      method: 'POST',
      url: '/api/claims/search',
      headers: { 'x-api-key': config.get('apiKeys.backofficeUiApiKey') }
    }
  })

  beforeEach(async () => {
    await server.db.collection('claims').deleteMany({})
    await server.db.collection('applications').deleteMany({})

    await server.db.collection('applications').insertOne({
      reference: 'IAHW-A1BL-0001',
      status: 'AGREED',
      organisation: { sbi: '111111111', name: 'Flagged agreement' },
      flags: [{ id: 'flag-1', deleted: false }]
    })

    await server.db.collection('applications').insertOne({
      reference: 'IAHW-G3CL-0002',
      status: 'AGREED',
      organisation: { sbi: '222222222', name: 'Unflagged agreement' },
      flags: []
    })

    await server.db.collection('claims').insertOne({
      reference: 'REBC-AAAA-0001',
      applicationReference: 'IAHW-A1BL-0001',
      status: 'IN_CHECK',
      type: 'REVIEW',
      createdAt: new Date('2025-04-01T00:00:00.000Z'),
      data: { typeOfLivestock: 'beef' }
    })

    await server.db.collection('claims').insertOne({
      reference: 'REBC-BBBB-0002',
      applicationReference: 'IAHW-G3CL-0002',
      status: 'IN_CHECK',
      type: 'REVIEW',
      createdAt: new Date('2025-04-02T00:00:00.000Z'),
      data: { typeOfLivestock: 'beef' }
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
      .claims.map((c) => c.reference)
      .sort()

  test('ALL returns every claim', async () => {
    const res = await server.inject({
      ...options,
      payload: searchPayload({ flag: 'ALL' })
    })

    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(JSON.parse(res.payload).total).toBe(2)
    expect(references(res.payload)).toEqual(['REBC-AAAA-0001', 'REBC-BBBB-0002'])
  })

  test('FLAGGED returns only claims whose application has a non-deleted flag', async () => {
    const res = await server.inject({
      ...options,
      payload: searchPayload({ flag: 'FLAGGED' })
    })

    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(references(res.payload)).toEqual(['REBC-AAAA-0001'])
  })

  test('NOT_FLAGGED includes claims whose application has no flags', async () => {
    const res = await server.inject({
      ...options,
      payload: searchPayload({ flag: 'NOT_FLAGGED' })
    })

    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(references(res.payload)).toEqual(['REBC-BBBB-0002'])
  })

  test('FLAGGED and NOT_FLAGGED counts add up to the ALL total', async () => {
    const [all, flagged, notFlagged] = await Promise.all([
      server.inject({ ...options, payload: searchPayload({ flag: 'ALL' }) }),
      server.inject({ ...options, payload: searchPayload({ flag: 'FLAGGED' }) }),
      server.inject({ ...options, payload: searchPayload({ flag: 'NOT_FLAGGED' }) })
    ])

    const allTotal = JSON.parse(all.payload).total
    const flaggedTotal = JSON.parse(flagged.payload).total
    const notFlaggedTotal = JSON.parse(notFlagged.payload).total

    expect(allTotal).toBe(2)
    expect(flaggedTotal + notFlaggedTotal).toBe(allTotal)
  })
})
