import {
  getByApplicationReference,
  getClaimByReference
} from './claim-repository.js'
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

  describe('getClaimByReference', () => {
    const mockFindOne = jest.fn(() => ({ sort: jest.fn() }))
    const mockCollection = jest.fn(() => ({ findOne: mockFindOne }))
    const mockDb = { collection: mockCollection }

    it('should call the claims collection with the correct query params', async () => {
      const mockClaim = {
        reference: 'FUBC-JTTU-SDQ7',
        applicationReference: 'IAHW-G3CL-V59P',
        createdAt: new Date('2025-08-15T09:00:53.000Z'),
        updatedAt: new Date('2025-08-15T09:00:53.000Z'),
        createdBy: 'admin',
        updatedBy: null,
        type: 'FOLLOW_UP',
        data: {
          amount: 837,
          piHunt: 'yes',
          vetsName: 'frrrr',
          claimType: 'E',
          biosecurity: 'yes',
          dateOfVisit: new Date('2025-08-15T00:00:00.000Z'),
          testResults: 'negative',
          dateOfTesting: new Date('2025-08-15T00:00:00.000Z'),
          laboratoryURN: 'URN34567ddd',
          vetRCVSNumber: '1234567',
          speciesNumbers: 'yes',
          typeOfLivestock: 'beef',
          piHuntAllAnimals: 'yes',
          piHuntRecommended: 'yes',
          reviewTestResults: 'negative'
        },
        status: 'IN_CHECK',
        statusHistory: [],
        herd: {
          id: '0e4f55ea-ed42-4139-9c46-c75ba63b0742',
          cph: '12/345/6789',
          name: 'EventTester',
          reasons: ['uniqueHealthNeeds'],
          version: 2,
          associatedAt: new Date('2025-08-15T09:00:53.420Z')
        },
        updateHistory: []
      }
      mockFindOne.mockResolvedValue(mockClaim)

      const result = await getClaimByReference(mockDb, 'RESH-O9UD-0025')

      expect(mockCollection).toHaveBeenCalledWith('claims')
      expect(mockFindOne).toHaveBeenCalledWith(
        { reference: 'RESH-O9UD-0025' },
        { projection: { _id: 0 } }
      )
      expect(result).toEqual(mockClaim)
    })

    it('should return null if no claim is found', async () => {
      mockFindOne.mockResolvedValue(null)

      const result = await getClaimByReference(mockDb, 'RESH-O9UD-0025')

      expect(result).toBeNull()
    })

    it('should propagate errors from the database', async () => {
      const error = new Error('Database error')
      mockFindOne.mockRejectedValue(error)

      await expect(
        getClaimByReference(mockDb, 'RESH-O9UD-0025')
      ).rejects.toThrow('Database error')
    })
  })
})
