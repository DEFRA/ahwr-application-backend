import { getByApplicationReference } from './claim-repository.js'
import { CLAIMS_COLLECTION } from '../constants/index.js'

describe('claim-repository', () => {
  describe('getByApplicationReference', () => {
    const mockToArray = jest.fn()
    const mockSort = jest.fn(() => ({ toArray: mockToArray }))
    const mockFind = jest.fn(() => ({ sort: mockSort }))
    const mockCollection = jest.fn(() => ({ find: mockFind }))
    const mockDb = { collection: mockCollection }

    it('should query with only applicationReference', async () => {
      const mockClaims = [{ id: 1 }]
      mockToArray.mockResolvedValueOnce(mockClaims)

      const result = await getByApplicationReference({
        db: mockDb,
        applicationReference: 'IAHW-8ZPZ-8CLI'
      })

      expect(mockCollection).toHaveBeenCalledWith(CLAIMS_COLLECTION)
      expect(mockFind).toHaveBeenCalledWith({
        applicationReference: 'IAHW-8ZPZ-8CLI'
      })
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 })
      expect(result).toEqual(mockClaims)
    })

    it('should query with applicationReference and typeOfLivestock', async () => {
      const mockClaims = [{ id: 2 }]
      mockToArray.mockResolvedValueOnce(mockClaims)

      const result = await getByApplicationReference({
        db: mockDb,
        applicationReference: 'IAHW-8ZPZ-8CLI',
        typeOfLivestock: 'sheep'
      })

      expect(mockFind).toHaveBeenCalledWith({
        applicationReference: 'IAHW-8ZPZ-8CLI',
        'data.typeOfLivestock': 'sheep'
      })
      expect(result).toEqual(mockClaims)
    })

    it('should return an empty array when no results', async () => {
      mockToArray.mockResolvedValueOnce([])

      const result = await getByApplicationReference({
        db: mockDb,
        applicationReference: 'IAHW-8ZPZ-8CLI'
      })

      expect(result).toEqual([])
    })
  })
})
