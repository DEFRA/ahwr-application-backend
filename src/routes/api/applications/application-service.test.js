import * as repo from '../../../repositories/application-repository.js'
import { getApplications, getClaims, getHerds } from './application-service.js'
import { getByApplicationReference } from '../../../repositories/claim-repository.js'
import { getHerdsByAppRefAndSpecies } from '../../../repositories/herd-repository.js'

jest.mock('../../../repositories/claim-repository.js')
jest.mock('../../../repositories/herd-repository.js')

describe('application-service', () => {
  const mockLogger = {
    setBindings: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getApplications', () => {
    it('should return applications when applications exist for sbi in repo', async () => {
      const mockResult = [
        {
          reference: 'IAHW-8ZPZ-8CLI',
          data: {
            reference: 'IAHW-8ZPZ-8CLI',
            declaration: true,
            offerStatus: 'accepted',
            confirmCheckDetails: 'yes'
          },
          status: 'AGREED',
          createdAt: '2025-01-01T00:00:00Z',
          organisation: {
            crn: '1101489790',
            sbi: '118409263',
            name: 'High Oustley Farm',
            email: 'jparkinsong@nosnikrapjz.com.test',
            address:
              'THE FIRS,South Croxton Road,HULVER FARM,MAIN STREET,MALVERN,TS21 2HU,United Kingdom',
            orgEmail: 'highoustleyfarmm@mrafyeltsuohgihh.com.test',
            userType: 'newUser',
            farmerName: 'J Parkinson'
          },
          redacted: false
        }
      ]
      jest.spyOn(repo, 'getApplicationsBySbi').mockResolvedValue(mockResult)

      const result = await getApplications({
        sbi: '123456789',
        logger: mockLogger,
        db: {}
      })

      expect(mockLogger.setBindings).toHaveBeenCalledWith({ sbi: '123456789' })
      expect(repo.getApplicationsBySbi).toHaveBeenCalledWith({}, '123456789')
      expect(result).toEqual([
        {
          type: 'EE',
          reference: 'IAHW-8ZPZ-8CLI',
          data: {
            reference: 'IAHW-8ZPZ-8CLI',
            declaration: true,
            offerStatus: 'accepted',
            confirmCheckDetails: 'yes'
          },
          status: 'AGREED',
          createdAt: '2025-01-01T00:00:00Z',
          organisation: {
            crn: '1101489790',
            sbi: '118409263',
            name: 'High Oustley Farm',
            email: 'jparkinsong@nosnikrapjz.com.test',
            address:
              'THE FIRS,South Croxton Road,HULVER FARM,MAIN STREET,MALVERN,TS21 2HU,United Kingdom',
            orgEmail: 'highoustleyfarmm@mrafyeltsuohgihh.com.test',
            userType: 'newUser',
            farmerName: 'J Parkinson'
          },
          redacted: false
        }
      ])
    })

    it('should return empty array when no applications exist for sbi in repo', async () => {
      jest.spyOn(repo, 'getApplicationsBySbi').mockResolvedValue([])

      const result = await getApplications({
        sbi: '123456789',
        logger: mockLogger,
        db: {}
      })

      expect(mockLogger.setBindings).toHaveBeenCalledWith({ sbi: '123456789' })
      expect(repo.getApplicationsBySbi).toHaveBeenCalledWith({}, '123456789')
      expect(result).toEqual([])
    })
  })

  describe('getClaims', () => {
    it('should return claims when claims exist for applicationReference and typeOfLivestock in repo', async () => {
      const mockResult = [
        {
          _id: '68ed456edc3075fcf51330d4',
          reference: 'FUBC-JTTU-SDQ7',
          applicationReference: 'IAHW-8ZPZ-8CLI',
          createdAt: '2025-08-15 09:00:53.422000 +00:00',
          updatedAt: '2025-08-15 09:00:53.422000 +00:00',
          createdBy: 'admin',
          updatedBy: null,
          type: 'FOLLOW-UP',
          data: {
            amount: 837,
            piHunt: 'yes',
            vetsName: 'frrrr',
            claimType: 'E',
            biosecurity: 'yes',
            dateOfVisit: '2025-08-15T00:00:00.000Z',
            testResults: 'negative',
            dateOfTesting: '2025-08-15T00:00:00.000Z',
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
            associatedAt: '2025-08-15T09:00:53.420Z'
          },
          updateHistory: []
        }
      ]
      getByApplicationReference.mockResolvedValue(mockResult)

      const result = await getClaims({
        db: {},
        logger: mockLogger,
        applicationReference: 'IAHW-8ZPZ-8CLI',
        typeOfLivestock: 'beef'
      })

      expect(mockLogger.setBindings).toHaveBeenCalledWith({
        applicationReference: 'IAHW-8ZPZ-8CLI',
        typeOfLivestock: 'beef'
      })
      expect(getByApplicationReference).toHaveBeenCalledWith({
        db: {},
        applicationReference: 'IAHW-8ZPZ-8CLI',
        typeOfLivestock: 'beef'
      })
      expect(result).toEqual([
        {
          reference: 'FUBC-JTTU-SDQ7',
          applicationReference: 'IAHW-8ZPZ-8CLI',
          createdAt: '2025-08-15 09:00:53.422000 +00:00',
          type: 'FOLLOW-UP',
          data: {
            amount: 837,
            piHunt: 'yes',
            vetsName: 'frrrr',
            claimType: 'E',
            biosecurity: 'yes',
            dateOfVisit: '2025-08-15T00:00:00.000Z',
            testResults: 'negative',
            dateOfTesting: '2025-08-15T00:00:00.000Z',
            laboratoryURN: 'URN34567ddd',
            vetRCVSNumber: '1234567',
            speciesNumbers: 'yes',
            typeOfLivestock: 'beef',
            piHuntAllAnimals: 'yes',
            piHuntRecommended: 'yes',
            reviewTestResults: 'negative'
          },
          status: 'IN_CHECK',
          herd: {
            cph: '12/345/6789',
            name: 'EventTester',
            reasons: ['uniqueHealthNeeds']
          }
        }
      ])
    })

    it('should return empty array when no claims exist for applicationReference in repo', async () => {
      getByApplicationReference.mockResolvedValue([])

      const result = await getClaims({
        db: {},
        logger: mockLogger,
        applicationReference: 'IAHW-8ZPZ-8CLI',
        typeOfLivestock: 'beef'
      })

      expect(mockLogger.setBindings).toHaveBeenCalledWith({
        applicationReference: 'IAHW-8ZPZ-8CLI',
        typeOfLivestock: 'beef'
      })
      expect(getByApplicationReference).toHaveBeenCalledWith({
        db: {},
        applicationReference: 'IAHW-8ZPZ-8CLI',
        typeOfLivestock: 'beef'
      })
      expect(result).toEqual([])
    })
  })

  describe('getHerds', () => {
    it('should return herds when herds exist for applicationReference and species in repo', async () => {
      const mockResult = [
        {
          id: '0e4f55ea-ed42-4139-9c46-c75ba63b0742',
          cph: '12/345/6789',
          name: 'EventTester',
          reasons: ['uniqueHealthNeeds'],
          species: 'beef',
          version: 2,
          createdAt: new Date('2025-08-15T09:00:53.414883+00:00'),
          createdBy: 'admin',
          isCurrent: true,
          applicationReference: 'IAHW-G7B4-UTZ5'
        }
      ]
      getHerdsByAppRefAndSpecies.mockResolvedValue(mockResult)

      const result = await getHerds({
        db: {},
        logger: mockLogger,
        applicationReference: 'IAHW-8ZPZ-8CLI',
        species: 'beef'
      })

      expect(mockLogger.setBindings).toHaveBeenCalledWith({
        applicationReference: 'IAHW-8ZPZ-8CLI',
        species: 'beef'
      })
      expect(getHerdsByAppRefAndSpecies).toHaveBeenCalledWith({
        db: {},
        applicationReference: 'IAHW-8ZPZ-8CLI',
        species: 'beef'
      })
      expect(result).toEqual({
        herds: [
          {
            id: '0e4f55ea-ed42-4139-9c46-c75ba63b0742',
            version: 2,
            name: 'EventTester',
            cph: '12/345/6789',
            reasons: ['uniqueHealthNeeds'],
            species: 'beef'
          }
        ]
      })
    })

    it('should return empty array when no herds exist for applicationReference and species in repo', async () => {
      getHerdsByAppRefAndSpecies.mockResolvedValue([])

      const result = await getHerds({
        db: {},
        logger: mockLogger,
        applicationReference: 'IAHW-8ZPZ-8CLI',
        species: 'beef'
      })

      expect(mockLogger.setBindings).toHaveBeenCalledWith({
        applicationReference: 'IAHW-8ZPZ-8CLI',
        species: 'beef'
      })
      expect(getHerdsByAppRefAndSpecies).toHaveBeenCalledWith({
        db: {},
        applicationReference: 'IAHW-8ZPZ-8CLI',
        species: 'beef'
      })
      expect(result).toEqual({
        herds: []
      })
    })
  })
})
