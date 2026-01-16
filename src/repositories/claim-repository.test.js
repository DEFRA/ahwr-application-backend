import {
  getByApplicationReference,
  getClaimByReference,
  updateClaimStatus,
  updateClaimData,
  addHerdToClaimData,
  updateClaimStatuses,
  findOnHoldClaims
} from './claim-repository.js'
import { CLAIMS_COLLECTION } from '../constants/index.js'
import { STATUS } from 'ffc-ahwr-common-library'

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid')
}))

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

      await expect(getClaimByReference(mockDb, 'RESH-O9UD-0025')).rejects.toThrow('Database error')
    })
  })

  describe('updateClaimStatus', () => {
    const mockCollection = { findOneAndUpdate: jest.fn() }
    const mockDb = { collection: jest.fn(() => mockCollection) }

    it('should call findOneAndUpdate with correct parameters and return result', async () => {
      const updatedClaim = {
        reference: 'REBC-VA4R-TRL7',
        status: 'WITHDRAWN',
        updatedBy: 'test-user',
        updatedAt: new Date('2025-10-22T16:21:46.091Z'),
        statusHistory: [
          {
            status: 'AGREED',
            createdBy: 'admin',
            createdAt: new Date('2025-10-22T16:21:46.091Z')
          }
        ]
      }
      mockCollection.findOneAndUpdate.mockResolvedValue(updatedClaim)

      const result = await updateClaimStatus({
        db: mockDb,
        reference: 'REBC-VA4R-TRL7',
        status: 'WITHDRAWN',
        user: 'test-user',
        note: null,
        updatedAt: new Date('2025-10-22T16:21:46.091Z')
      })

      expect(mockDb.collection).toHaveBeenCalledWith('claims')
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { reference: 'REBC-VA4R-TRL7' },
        {
          $set: {
            status: 'WITHDRAWN',
            updatedBy: 'test-user',
            updatedAt: new Date('2025-10-22T16:21:46.091Z')
          },
          $push: {
            statusHistory: {
              status: 'WITHDRAWN',
              createdAt: new Date('2025-10-22T16:21:46.091Z'),
              createdBy: 'test-user',
              note: null
            }
          }
        },
        { returnDocument: 'after' }
      )
      expect(result).toBe(updatedClaim)
    })
    it('should call findOneAndUpdate with correct parameters and return result with optional note', async () => {
      const updatedClaim = {
        reference: 'REBC-VA4R-TRL7',
        status: 'WITHDRAWN',
        updatedBy: 'test-user',
        updatedAt: new Date('2025-10-22T16:21:46.091Z'),
        statusHistory: [
          {
            status: 'AGREED',
            createdBy: 'admin',
            createdAt: new Date('2025-10-22T16:21:46.091Z'),
            note: 'This is a note'
          }
        ]
      }
      mockCollection.findOneAndUpdate.mockResolvedValue(updatedClaim)

      const result = await updateClaimStatus({
        db: mockDb,
        reference: 'REBC-VA4R-TRL7',
        status: 'WITHDRAWN',
        user: 'test-user',
        updatedAt: new Date('2025-10-22T16:21:46.091Z'),
        note: 'This is a note'
      })

      expect(mockDb.collection).toHaveBeenCalledWith('claims')
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { reference: 'REBC-VA4R-TRL7' },
        {
          $set: {
            status: 'WITHDRAWN',
            updatedBy: 'test-user',
            updatedAt: new Date('2025-10-22T16:21:46.091Z')
          },
          $push: {
            statusHistory: {
              status: 'WITHDRAWN',
              createdAt: new Date('2025-10-22T16:21:46.091Z'),
              createdBy: 'test-user',
              note: 'This is a note'
            }
          }
        },
        { returnDocument: 'after' }
      )
      expect(result).toBe(updatedClaim)
    })
  })

  describe('updateClaimData', () => {
    const mockDb = { collection: jest.fn() }
    const mockCollection = { findOneAndUpdate: jest.fn() }

    beforeEach(() => {
      jest.clearAllMocks()
      mockDb.collection.mockReturnValue(mockCollection)
    })

    it('should update claim data property and history', async () => {
      const updatedAt = new Date('2024-11-20T13:51:24.291Z')

      await updateClaimData({
        db: mockDb,
        reference: 'FUBC-JTTU-SDQ7',
        updatedProperty: 'vetsName',
        newValue: 'Jane',
        oldValue: 'John',
        note: 'Vets name updated',
        user: 'test-user',
        updatedAt
      })

      expect(mockDb.collection).toHaveBeenCalledWith('claims')
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { reference: 'FUBC-JTTU-SDQ7' },
        {
          $set: {
            'data.vetsName': 'Jane',
            updatedAt,
            updatedBy: 'test-user'
          },
          $push: {
            updateHistory: {
              id: 'mocked-uuid',
              note: 'Vets name updated',
              newValue: 'Jane',
              oldValue: 'John',
              createdAt: updatedAt,
              createdBy: 'test-user',
              eventType: 'claim-vetsName',
              updatedProperty: 'vetsName'
            }
          }
        }
      )
    })
  })

  describe('addHerdToClaimData', () => {
    const mockDb = { collection: jest.fn() }
    const mockCollection = { findOneAndUpdate: jest.fn() }

    beforeEach(() => {
      jest.clearAllMocks()
      mockDb.collection.mockReturnValue(mockCollection)
    })

    it('should update claim herd data and add history entry', async () => {
      const associatedAt = new Date('2024-11-20T13:51:24.291Z')

      await addHerdToClaimData({
        db: mockDb,
        claimRef: 'FUBC-JTTU-SDQ7',
        claimHerdData: {
          id: 'herd-id-123',
          version: 2,
          associatedAt,
          name: 'New Herd Name',
          cph: '12/345/6789',
          reasons: ['diseaseControl', 'uniqueHealthNeeds']
        },
        createdBy: 'test-user'
      })

      expect(mockDb.collection).toHaveBeenCalledWith('claims')
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { reference: 'FUBC-JTTU-SDQ7' },
        {
          $set: {
            'herd.id': 'herd-id-123',
            'herd.version': 2,
            'herd.associatedAt': associatedAt,
            'herd.name': 'New Herd Name',
            'herd.cph': '12/345/6789',
            'herd.reasons': ['diseaseControl', 'uniqueHealthNeeds'],
            updatedBy: 'test-user',
            updatedAt: expect.any(Date)
          },
          $push: {
            updateHistory: {
              id: expect.any(String),
              note: 'Herd details were retroactively applied to this pre-multiple herds claim',
              newValue: 'New Herd Name',
              oldValue: 'Unnamed herd',
              createdAt: expect.any(Date),
              createdBy: 'test-user',
              eventType: 'claim-herdAssociated',
              updatedProperty: 'herdName'
            }
          }
        }
      )
    })
  })

  describe('updateClaimStatuses', () => {
    const mockDb = { collection: jest.fn() }
    const mockCollection = { updateMany: jest.fn().mockResolvedValue({ modifiedCount: 2 }) }

    beforeEach(() => {
      jest.clearAllMocks()
      mockDb.collection.mockReturnValue(mockCollection)
    })

    it('should update all the claims with the given status', async () => {
      const references = ['FUBC-JTTU-SDQ7', 'RESH-FGTR-3H72']
      const status = STATUS.READY_TO_PAY
      const updatedAt = new Date()
      const user = 'test-user'

      const { updatedRecordCount } = await updateClaimStatuses({
        db: mockDb,
        references,
        user,
        status,
        updatedAt
      })

      expect(updatedRecordCount).toBe(references.length)
      expect(mockDb.collection).toHaveBeenCalledWith('claims')
      expect(mockCollection.updateMany).toHaveBeenCalledWith(
        { reference: { $in: references } },
        {
          $set: {
            status,
            updatedAt,
            updatedBy: user
          },
          $push: {
            statusHistory: {
              status,
              createdAt: updatedAt,
              createdBy: user
            }
          }
        }
      )
    })

    it('should throw if no references are given', async () => {
      const references = []
      const status = STATUS.READY_TO_PAY
      const updatedAt = new Date()
      const user = 'test-user'

      await expect(
        updateClaimStatuses({
          db: mockDb,
          references,
          user,
          status,
          updatedAt
        })
      ).rejects.toThrow('references must be a non-empty array')
    })
  })

  describe('findOnHoldClaims', () => {
    let mockDb
    let mockCursor
    let mockFind
    const beforeDate = new Date('2025-12-30T00:00:00Z')

    beforeEach(() => {
      mockCursor = {
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn()
      }

      mockFind = { find: jest.fn().mockReturnValue(mockCursor) }
      mockDb = {
        collection: jest.fn().mockReturnValue(mockFind)
      }
    })

    it('returns an array of claim references matching ON_HOLD and beforeDate', async () => {
      const fakeClaims = [
        { reference: 'RESH-FDRE-2234', something: 'else' },
        { reference: 'FUBC-1LAG-RMC1', something: 'else' }
      ]
      mockCursor.toArray.mockResolvedValue(fakeClaims)

      const result = await findOnHoldClaims({ db: mockDb, beforeDate })

      expect(mockDb.collection).toHaveBeenCalledWith('claims')
      expect(mockCursor.limit).toHaveBeenCalledWith(500)
      expect(result).toEqual(fakeClaims)
    })

    it('respects a custom limit when provided', async () => {
      const fakeClaims = [{ reference: 'RESH-FDRE-2234' }]
      mockCursor.toArray.mockResolvedValue(fakeClaims)

      const result = await findOnHoldClaims({ db: mockDb, beforeDate, limit: 10 })

      expect(mockCursor.limit).toHaveBeenCalledWith(10)
      expect(result).toEqual(fakeClaims)
    })
  })
})
