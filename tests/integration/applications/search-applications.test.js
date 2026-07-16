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

    // New-world IAHW, in range
    await server.db.collection('applications').insertOne({
      reference: 'IAHW-AAAA-0001',
      status: 'AGREED',
      createdAt: new Date('2026-03-15T00:00:00.000Z'),
      organisation: { sbi: '111111111', name: 'IAHW New World In Range' },
      flags: []
    })

    // Old-world IAHW, in range — proves $unionWith applies the same filter to
    // both collections, not just the new-world one
    await server.db.collection('owapplications').insertOne({
      reference: 'AHWR-BBBB-0002',
      status: 'READY_TO_PAY',
      createdAt: new Date('2026-04-01T00:00:00.000Z'),
      organisation: { sbi: '222222222', name: 'IAHW Old World In Range' },
      flags: []
    })

    // PBR, in range but wrong type
    await server.db.collection('applications').insertOne({
      reference: 'POUL-CCCC-0003',
      status: 'AGREED',
      createdAt: new Date('2026-03-20T00:00:00.000Z'),
      organisation: { sbi: '333333333', name: 'PBR In Range' },
      flags: []
    })

    // IAHW, right type but outside the date range
    await server.db.collection('applications').insertOne({
      reference: 'IAHW-DDDD-0004',
      status: 'AGREED',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      organisation: { sbi: '444444444', name: 'IAHW Outside Range' },
      flags: []
    })

    // PBR, wrong type and outside the date range
    await server.db.collection('applications').insertOne({
      reference: 'POUL-EEEE-0005',
      status: 'AGREED',
      createdAt: new Date('2025-06-01T00:00:00.000Z'),
      organisation: { sbi: '555555555', name: 'PBR Outside Range' },
      flags: []
    })

    // Old-world IAHW, right type but outside the date range — gives the
    // dateTo-only test a positive old-world match too, not just an exclusion.
    // No old-world PBR fixture: old-world applications predate poultry's
    // inclusion in the scheme, so that combination isn't a real scenario.
    await server.db.collection('owapplications').insertOne({
      reference: 'AHWR-FFFF-0006',
      status: 'AGREED',
      createdAt: new Date('2025-03-01T00:00:00.000Z'),
      organisation: { sbi: '666666666', name: 'IAHW Old World Outside Range' },
      flags: []
    })
  })

  afterAll(async () => {
    await teardownTestEnvironment()
  })

  const searchPayload = (overrides) => ({
    search: { text: '', type: '' },
    limit: 20,
    offset: 0,
    filter: [],
    ...overrides
  })

  const references = (body) => JSON.parse(body).applications.map((a) => a.reference).sort()

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

  describe('date-only filtering', () => {
    test('dateFrom only returns everything on or after that date', async () => {
      const res = await server.inject({
        ...options,
        payload: searchPayload({ dateFrom: new Date('2026-01-01T00:00:00.000Z') })
      })

      expect(res.statusCode).toBe(StatusCodes.OK)
      expect(references(res.payload)).toEqual([
        'AHWR-BBBB-0002',
        'IAHW-AAAA-0001',
        'POUL-CCCC-0003'
      ])
    })

    test('dateTo only returns everything on or before that date', async () => {
      const res = await server.inject({
        ...options,
        payload: searchPayload({ dateTo: new Date('2025-12-31T23:59:59.999Z') })
      })

      expect(res.statusCode).toBe(StatusCodes.OK)
      expect(references(res.payload)).toEqual([
        'AHWR-FFFF-0006',
        'IAHW-DDDD-0004',
        'POUL-EEEE-0005'
      ])
    })

    test('dateFrom and dateTo together bound an inclusive range', async () => {
      const res = await server.inject({
        ...options,
        payload: searchPayload({
          dateFrom: new Date('2026-01-01T00:00:00.000Z'),
          dateTo: new Date('2026-06-30T23:59:59.999Z')
        })
      })

      expect(res.statusCode).toBe(StatusCodes.OK)
      expect(references(res.payload)).toEqual([
        'AHWR-BBBB-0002',
        'IAHW-AAAA-0001',
        'POUL-CCCC-0003'
      ])
    })

    test('neither date returns everything, unfiltered', async () => {
      const res = await server.inject({ ...options, payload: searchPayload({}) })

      expect(res.statusCode).toBe(StatusCodes.OK)
      expect(JSON.parse(res.payload).total).toBe(6)
    })
  })

  describe('agreementType-only filtering', () => {
    test('IAHW returns old-world and new-world livestock agreements, regardless of date', async () => {
      const res = await server.inject({
        ...options,
        payload: searchPayload({ agreementType: 'IAHW' })
      })

      expect(res.statusCode).toBe(StatusCodes.OK)
      expect(references(res.payload)).toEqual([
        'AHWR-BBBB-0002',
        'AHWR-FFFF-0006',
        'IAHW-AAAA-0001',
        'IAHW-DDDD-0004'
      ])
    })

    test('PBR returns only poultry agreements, regardless of date', async () => {
      const res = await server.inject({
        ...options,
        payload: searchPayload({ agreementType: 'PBR' })
      })

      expect(res.statusCode).toBe(StatusCodes.OK)
      expect(references(res.payload)).toEqual(['POUL-CCCC-0003', 'POUL-EEEE-0005'])
    })

    test('ALL returns everything, unfiltered', async () => {
      const res = await server.inject({
        ...options,
        payload: searchPayload({ agreementType: 'ALL' })
      })

      expect(res.statusCode).toBe(StatusCodes.OK)
      expect(JSON.parse(res.payload).total).toBe(6)
    })
  })
})
