import { searchClaims } from './claim-search-repository'

describe('claim-search-repository', () => {
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
        aggregate: jest
          .fn()
          .mockReturnValueOnce({
            toArray: jest.fn().mockReturnValue([{ total: 50 }])
          })
          .mockReturnValueOnce({
            toArray: jest.fn().mockReturnValue([{ reference: 'IAHW-ABCD-1234' }])
          })
      }

      const search = null
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
            toArray: jest.fn().mockReturnValue([{ total: 50 }])
          })
          .mockReturnValueOnce({
            toArray: jest.fn().mockReturnValue([{ reference: 'IAHW-ABCD-1234' }])
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
      expect(collectionMock.aggregate.mock.calls[0][0][4]).toEqual({
        $match: {
          'application.organisation.sbi': { $options: 'i', $regex: '123456789' }
        }
      })
    })

    it('returns total and claims if there a filter is provided', async () => {
      const dbMock = {
        collection: jest.fn(() => collectionMock)
      }
      const collectionMock = {
        aggregate: jest
          .fn()
          .mockReturnValueOnce({
            toArray: jest.fn().mockReturnValue([{ total: 50 }])
          })
          .mockReturnValueOnce({
            toArray: jest.fn().mockReturnValue([{ reference: 'IAHW-ABCD-1234' }])
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
      expect(collectionMock.aggregate.mock.calls[0][0][4]).toEqual({
        $match: {
          [filter.field]: { [`$${filter.op}`]: filter.value }
        }
      })
    })
  })
})
