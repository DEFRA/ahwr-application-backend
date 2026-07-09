import { searchClaims } from './claim-search-repository'

describe('claim-search-repository', () => {
  const defaultSort = { field: 'createdAt', direction: 'DESC' }

  const singleResultDb = () => {
    const collectionMock = {
      aggregate: jest.fn().mockReturnValue({
        toArray: jest
          .fn()
          .mockReturnValue([{ data: [{ reference: 'IAHW-ABCD-1234' }], total: [{ total: 50 }] }])
      })
    }
    const dbMock = { collection: jest.fn(() => collectionMock) }
    return { dbMock, collectionMock }
  }

  const matchStageOf = (collectionMock) => collectionMock.aggregate.mock.calls[0][0][0].$match

  const sortStageOf = (collectionMock) =>
    collectionMock.aggregate.mock.calls[0][0][1].$facet.data[0].$sort

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('searchClaims', () => {
    it('returns an empty set of results if there is a search type but it isnt valid', async () => {
      const search = { text: 'something', type: 'name' }
      const filter = null
      const offset = 0
      const limit = 30
      const sort = { field: 'createdAt', direction: 'DESC' }
      const dbMock = {}

      const result = await searchClaims(search, filter, offset, limit, dbMock, sort)

      expect(result).toEqual({ claims: [], total: 0 })
    })

    it('returns total and claims if there is no search or filter', async () => {
      const dbMock = {
        collection: jest.fn(() => collectionMock)
      }
      const collectionMock = {
        aggregate: jest.fn().mockReturnValueOnce({
          toArray: jest
            .fn()
            .mockReturnValue([{ data: [{ reference: 'IAHW-ABCD-1234' }], total: [{ total: 50 }] }])
        })
      }

      const search = {
        type: 'reset',
        text: ''
      }
      const filter = null
      const offset = 0
      const limit = 30
      const sort = { field: 'createdAt', direction: 'DESC' }

      const result = await searchClaims(search, filter, offset, limit, dbMock, sort)

      expect(result).toEqual({
        claims: [{ reference: 'IAHW-ABCD-1234' }],
        total: 50
      })
    })

    it('returns total and claims if there a search is provided', async () => {
      const dbMock = {
        collection: jest.fn(() => collectionMock)
      }
      const collectionMock = {
        aggregate: jest
          .fn()
          .mockReturnValueOnce({
            toArray: jest.fn().mockReturnValue([{ reference: 'IAHW-ABCD-1234' }])
          })
          .mockReturnValueOnce({
            toArray: jest
              .fn()
              .mockReturnValue([
                { data: [{ reference: 'IAHW-ABCD-1234' }], total: [{ total: 50 }] }
              ])
          })
      }

      const search = { type: 'sbi', text: '123456789' }
      const filter = null
      const offset = 0
      const limit = 30
      const sort = { field: 'createdAt', direction: 'DESC' }

      const result = await searchClaims(search, filter, offset, limit, dbMock, sort)

      expect(result).toEqual({
        claims: [{ reference: 'IAHW-ABCD-1234' }],
        total: 50
      })
      expect(collectionMock.aggregate.mock.calls[0][0][0]).toEqual({
        $match: {
          'organisation.sbi': { $options: 'i', $regex: '123456789' }
        }
      })
    })

    it('returns total and claims when search type is appRef', async () => {
      const dbMock = {
        collection: jest.fn(() => collectionMock)
      }
      const collectionMock = {
        aggregate: jest.fn().mockReturnValueOnce({
          toArray: jest
            .fn()
            .mockReturnValue([{ data: [{ reference: 'IAHW-ABCD-1234' }], total: [{ total: 50 }] }])
        })
      }

      const search = { type: 'appRef', text: 'IAHW-ABCD-1234' }
      const filter = null
      const offset = 0
      const limit = 30
      const sort = { field: 'createdAt', direction: 'DESC' }

      const result = await searchClaims(search, filter, offset, limit, dbMock, sort)

      expect(result).toEqual({
        claims: [{ reference: 'IAHW-ABCD-1234' }],
        total: 50
      })
      expect(collectionMock.aggregate.mock.calls[0][0][0]).toEqual({
        $match: {
          applicationReference: { $options: 'i', $regex: 'IAHW-ABCD-1234' }
        }
      })
    })

    it('returns total and claims if there a filter is provided', async () => {
      const dbMock = {
        collection: jest.fn(() => collectionMock)
      }
      const collectionMock = {
        aggregate: jest.fn().mockReturnValueOnce({
          toArray: jest
            .fn()
            .mockReturnValue([{ data: [{ reference: 'IAHW-ABCD-1234' }], total: [{ total: 50 }] }])
        })
      }

      const search = null
      const filter = { field: 'updatedAt', op: 'lte', value: '2025-01-17' }
      const offset = 0
      const limit = 30
      const sort = { field: 'createdAt', direction: 'DESC' }

      const result = await searchClaims(search, filter, offset, limit, dbMock, sort)

      expect(result).toEqual({
        claims: [{ reference: 'IAHW-ABCD-1234' }],
        total: 50
      })
      expect(collectionMock.aggregate.mock.calls[0][0][0]).toEqual({
        $match: {
          [filter.field]: { [`$${filter.op}`]: filter.value }
        }
      })
    })

    it('applies a case-insensitive regex on reference when search type is ref', async () => {
      const { dbMock, collectionMock } = singleResultDb()

      await searchClaims({ type: 'ref', text: 'IAHW-ABCD-1234' }, null, 0, 30, dbMock, defaultSort)

      expect(matchStageOf(collectionMock)).toEqual({
        reference: { $regex: 'IAHW-ABCD-1234', $options: 'i' }
      })
    })

    it('uppercases the text and replaces spaces with underscores when search type is status', async () => {
      const { dbMock, collectionMock } = singleResultDb()

      await searchClaims({ type: 'status', text: 'on hold' }, null, 0, 30, dbMock, defaultSort)

      expect(matchStageOf(collectionMock)).toEqual({
        status: { $regex: 'ON_HOLD', $options: 'i' }
      })
    })

    it('applies a case-insensitive regex on the livestock type when search type is species', async () => {
      const { dbMock, collectionMock } = singleResultDb()

      await searchClaims({ type: 'species', text: 'beef' }, null, 0, 30, dbMock, defaultSort)

      expect(matchStageOf(collectionMock)).toEqual({
        'data.typeOfLivestock': { $regex: 'beef', $options: 'i' }
      })
    })

    it('sets a single-day createdAt range when search type is date', async () => {
      const { dbMock, collectionMock } = singleResultDb()

      await searchClaims({ type: 'date', text: '17/01/2025' }, null, 0, 30, dbMock, defaultSort)

      expect(matchStageOf(collectionMock)).toEqual({
        createdAt: { $gte: new Date(2025, 0, 17), $lt: new Date(2025, 0, 18) }
      })
    })

    it('applies no search conditions when the type has no matching clause', async () => {
      const { dbMock, collectionMock } = singleResultDb()

      await searchClaims({ type: 'reset', text: 'anything' }, null, 0, 30, dbMock, defaultSort)

      expect(matchStageOf(collectionMock)).toEqual({})
    })

    it('ignores a filter that uses an unsupported operator', async () => {
      const { dbMock, collectionMock } = singleResultDb()

      await searchClaims(
        null,
        { field: 'updatedAt', op: 'notreal', value: 'x' },
        0,
        30,
        dbMock,
        defaultSort
      )

      expect(matchStageOf(collectionMock)).toEqual({})
    })
  })

  describe('sorting', () => {
    it.each([
      ['status', 'DESC', { status: -1 }],
      ['claim date', 'ASC', { createdAt: 1 }],
      ['sbi', 'DESC', { 'application.organisation.sbi': -1 }],
      ['claim number', 'ASC', { reference: 1 }],
      ['type of visit', 'DESC', { type: -1 }],
      ['species', 'ASC', { 'data.typeOfLivestock': 1 }],
      ['an unrecognised field', 'DESC', { createdAt: -1 }]
    ])('sorts by %s (%s)', async (field, direction, expected) => {
      const { dbMock, collectionMock } = singleResultDb()

      await searchClaims(null, null, 0, 30, dbMock, { field, direction })

      expect(sortStageOf(collectionMock)).toEqual(expected)
    })

    it('sorts by createdAt when no field is provided', async () => {
      const { dbMock, collectionMock } = singleResultDb()

      await searchClaims(null, null, 0, 30, dbMock, { field: undefined, direction: 'ASC' })

      expect(sortStageOf(collectionMock)).toEqual({ createdAt: 1 })
    })

    it('defaults to a descending createdAt sort when no sort is provided', async () => {
      const { dbMock, collectionMock } = singleResultDb()

      await searchClaims(null, null, 0, 30, dbMock)

      expect(sortStageOf(collectionMock)).toEqual({ createdAt: -1 })
    })
  })
})
