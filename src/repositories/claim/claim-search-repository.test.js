import {
  APPLICATION_REFERENCE_PREFIX_OLD_WORLD,
  APPLICATION_REFERENCE_PREFIX_NEW_WORLD,
  APPLICATION_REFERENCE_PREFIX_POULTRY
} from 'ffc-ahwr-common-library'
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
      const offset = 0
      const limit = 30
      const sort = { field: 'createdAt', direction: 'DESC' }
      const dbMock = {}

      const result = await searchClaims(dbMock, { search }, offset, limit, sort)

      expect(result).toEqual({ claims: [], total: 0 })
    })

    it('returns total and claims if there is no search', async () => {
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
      const offset = 0
      const limit = 30
      const sort = { field: 'createdAt', direction: 'DESC' }

      const result = await searchClaims(dbMock, { search }, offset, limit, sort)

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
      const offset = 0
      const limit = 30
      const sort = { field: 'createdAt', direction: 'DESC' }

      const result = await searchClaims(dbMock, { search }, offset, limit, sort)

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
      const offset = 0
      const limit = 30
      const sort = { field: 'createdAt', direction: 'DESC' }

      const result = await searchClaims(dbMock, { search }, offset, limit, sort)

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

    it('returns total and claims if there a status is provided', async () => {
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
      const status = 'AGREED'
      const offset = 0
      const limit = 30
      const sort = { field: 'createdAt', direction: 'DESC' }

      const result = await searchClaims(dbMock, { search, status }, offset, limit, sort)

      expect(result).toEqual({
        claims: [{ reference: 'IAHW-ABCD-1234' }],
        total: 50
      })
      expect(collectionMock.aggregate.mock.calls[0][0][0]).toEqual({
        $match: {
          status
        }
      })
    })

    it('applies a case-insensitive regex on reference when search type is ref', async () => {
      const { dbMock, collectionMock } = singleResultDb()

      await searchClaims(
        dbMock,
        { search: { type: 'ref', text: 'IAHW-ABCD-1234' } },
        0,
        30,
        defaultSort
      )

      expect(matchStageOf(collectionMock)).toEqual({
        reference: { $regex: 'IAHW-ABCD-1234', $options: 'i' }
      })
    })

    it('applies a case-insensitive regex on the livestock type when search type is species', async () => {
      const { dbMock, collectionMock } = singleResultDb()

      await searchClaims(dbMock, { search: { type: 'species', text: 'beef' } }, 0, 30, defaultSort)

      expect(matchStageOf(collectionMock)).toEqual({
        'data.typeOfLivestock': { $regex: 'beef', $options: 'i' }
      })
    })

    it('applies no search conditions when the type has no matching clause', async () => {
      const { dbMock, collectionMock } = singleResultDb()

      await searchClaims(
        dbMock,
        { search: { type: 'reset', text: 'anything' } },
        0,
        30,
        defaultSort
      )

      expect(matchStageOf(collectionMock)).toEqual({})
    })

    it.each([
      {
        agreementType: 'IAHW',
        prefixes: [APPLICATION_REFERENCE_PREFIX_OLD_WORLD, APPLICATION_REFERENCE_PREFIX_NEW_WORLD]
      },
      {
        agreementType: 'PBR',
        prefixes: [APPLICATION_REFERENCE_PREFIX_POULTRY]
      }
    ])(
      'restricts applicationReference by prefix when agreementType is $agreementType',
      async ({ agreementType, prefixes }) => {
        const { dbMock, collectionMock } = singleResultDb()

        await searchClaims(dbMock, { search: null, agreementType }, 0, 30, defaultSort)

        expect(matchStageOf(collectionMock)).toEqual({
          applicationReference: { $regex: `^(${prefixes.join('|')})`, $options: 'i' }
        })
      }
    )

    it.each(['AGREED', 'NOT_AGREED'])('restricts status when status is %s', async (status) => {
      const { dbMock, collectionMock } = singleResultDb()

      await searchClaims(dbMock, { search: null, status }, 0, 30, defaultSort)

      expect(matchStageOf(collectionMock)).toEqual({
        status
      })
    })

    it('does not restrict applicationReference when agreementType is absent', async () => {
      const { dbMock, collectionMock } = singleResultDb()

      await searchClaims(dbMock, { search: null }, 0, 30, defaultSort)

      expect(matchStageOf(collectionMock)).toEqual({})
    })

    it('does not restrict applicationReference when agreementType is explicitly ALL', async () => {
      const { dbMock, collectionMock } = singleResultDb()

      await searchClaims(dbMock, { search: null, agreementType: 'ALL' }, 0, 30, defaultSort)

      expect(matchStageOf(collectionMock)).toEqual({})
    })

    it('restricts by createdAt in or after dateFrom when provided', async () => {
      const { dbMock, collectionMock } = singleResultDb()
      const dateFrom = new Date(2025, 0, 1)

      await searchClaims(dbMock, { search: null, dateFrom }, 0, 30, defaultSort)

      expect(matchStageOf(collectionMock)).toEqual({
        createdAt: { $gte: dateFrom }
      })
    })

    it('restricts by createdAt in or before dateTo when provided', async () => {
      const { dbMock, collectionMock } = singleResultDb()
      const dateTo = new Date(2025, 11, 31)

      await searchClaims(dbMock, { search: null, dateTo }, 0, 30, defaultSort)

      expect(matchStageOf(collectionMock)).toEqual({
        createdAt: { $lte: dateTo }
      })
    })

    it('restricts by createdAt within dateFrom and dateTo inclusive when provided', async () => {
      const { dbMock, collectionMock } = singleResultDb()
      const dateFrom = new Date(2025, 0, 1)
      const dateTo = new Date(2025, 11, 31)

      await searchClaims(dbMock, { search: null, dateFrom, dateTo }, 0, 30, defaultSort)

      expect(matchStageOf(collectionMock)).toEqual({
        createdAt: { $gte: dateFrom, $lte: dateTo }
      })
    })

    it('does not restrict by createdAt when neither dateFrom nor dateTo are provided', async () => {
      const { dbMock, collectionMock } = singleResultDb()

      await searchClaims(dbMock, { search: null }, 0, 30, defaultSort)

      expect(matchStageOf(collectionMock)).toEqual({})
    })

    it('lets an exact appRef search take precedence over agreementType', async () => {
      const { dbMock, collectionMock } = singleResultDb()

      await searchClaims(
        dbMock,
        {
          search: { type: 'appRef', text: 'POUL-ABCD-1234' },
          agreementType: 'IAHW'
        },
        0,
        30,
        defaultSort
      )

      expect(matchStageOf(collectionMock)).toEqual({
        applicationReference: { $regex: 'POUL-ABCD-1234', $options: 'i' }
      })
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

      await searchClaims(dbMock, { search: null }, 0, 30, { field, direction })

      expect(sortStageOf(collectionMock)).toEqual(expected)
    })

    it('sorts by createdAt when no field is provided', async () => {
      const { dbMock, collectionMock } = singleResultDb()

      await searchClaims(dbMock, { search: null }, 0, 30, {
        field: undefined,
        direction: 'ASC'
      })

      expect(sortStageOf(collectionMock)).toEqual({ createdAt: 1 })
    })

    it('defaults to a descending createdAt sort when no sort is provided', async () => {
      const { dbMock, collectionMock } = singleResultDb()

      await searchClaims(dbMock, { search: null }, 0, 30)

      expect(sortStageOf(collectionMock)).toEqual({ createdAt: -1 })
    })
  })
})
