import * as appRepo from '../../../repositories/application-repository.js'
import * as owAppRepo from '../../../repositories/ow-application-repository.js'
import {
  getApplications,
  getClaims,
  getHerds,
  getApplication,
  createApplication
} from './applications-service.js'
import { getByApplicationReference } from '../../../repositories/claim-repository.js'
import { getHerdsByAppRefAndSpecies } from '../../../repositories/herd-repository.js'
import { publishDocumentRequestEvent } from '../../../messaging/publish-outbound-notification.js'
import { raiseApplicationStatusEvent } from '../../../event-publisher/index.js'

jest.mock('../../../repositories/application-repository.js')
jest.mock('../../../repositories/ow-application-repository.js')
jest.mock('../../../repositories/claim-repository.js')
jest.mock('../../../repositories/herd-repository.js')
jest.mock('../../../messaging/publish-outbound-notification.js')
jest.mock('../../../event-publisher/index.js')

describe('applications-service', () => {
  const mockLogger = {
    setBindings: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
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
      const mockOWResult = [
        {
          reference: 'AHWR-8ZPZ-8CLI',
          data: {
            reference: 'AHWR-8ZPZ-8CLI',
            declaration: true,
            offerStatus: 'accepted',
            confirmCheckDetails: 'yes'
          },
          status: 'AGREED',
          createdAt: '2023-01-01T00:00:00Z',
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
      jest.spyOn(appRepo, 'getApplicationsBySbi').mockResolvedValue(mockResult)
      jest.spyOn(owAppRepo, 'getOWApplicationsBySbi').mockResolvedValue(mockOWResult)

      const result = await getApplications({
        sbi: '123456789',
        logger: mockLogger,
        db: {}
      })

      expect(mockLogger.setBindings).toHaveBeenCalledWith({ sbi: '123456789' })
      expect(appRepo.getApplicationsBySbi).toHaveBeenCalledWith({}, '123456789')
      expect(owAppRepo.getOWApplicationsBySbi).toHaveBeenCalledWith({}, '123456789')
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
        },
        {
          type: 'VV',
          reference: 'AHWR-8ZPZ-8CLI',
          data: {
            reference: 'AHWR-8ZPZ-8CLI',
            declaration: true,
            offerStatus: 'accepted',
            confirmCheckDetails: 'yes'
          },
          status: 'AGREED',
          createdAt: '2023-01-01T00:00:00Z',
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
      jest.spyOn(appRepo, 'getApplicationsBySbi').mockResolvedValue([])
      jest.spyOn(owAppRepo, 'getOWApplicationsBySbi').mockResolvedValue([])

      const result = await getApplications({
        sbi: '123456789',
        logger: mockLogger,
        db: {}
      })

      expect(mockLogger.setBindings).toHaveBeenCalledWith({ sbi: '123456789' })
      expect(appRepo.getApplicationsBySbi).toHaveBeenCalledWith({}, '123456789')
      expect(owAppRepo.getOWApplicationsBySbi).toHaveBeenCalledWith({}, '123456789')
      expect(result).toEqual([])
    })
  })

  describe('createApplication', () => {
    it('should not create application when previous open application exists in repo', async () => {
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
          createdAt: '2025-01-01T00:00:00Z'
        }
      ]
      jest.spyOn(appRepo, 'getApplicationsBySbi').mockResolvedValue(mockResult)

      await expect(
        createApplication({
          applicationRequest: {
            organisation: {
              sbi: '123456789'
            }
          },
          logger: mockLogger,
          db: {}
        })
      ).rejects.toThrow(
        'Recent application already exists: {"reference":"IAHW-8ZPZ-8CLI","createdAt":"2025-01-01T00:00:00Z"}'
      )
    })

    describe('successfully create application', () => {
      const inputRequest = {
        reference: 'TEMP-8ZPZ-8CLI',
        declaration: true,
        offerStatus: 'accepted',
        confirmCheckDetails: 'yes',
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
        }
      }

      const expectedApplication = {
        contactHistory: [],
        createdAt: expect.any(Date),
        createdBy: 'admin',
        data: {
          confirmCheckDetails: 'yes',
          declaration: true,
          offerStatus: 'accepted',
          reference: 'TEMP-8ZPZ-8CLI'
        },
        eligiblePiiRedaction: true,
        flags: [],
        organisation: {
          address:
            'THE FIRS,South Croxton Road,HULVER FARM,MAIN STREET,MALVERN,TS21 2HU,United Kingdom',
          crn: '1101489790',
          email: 'jparkinsong@nosnikrapjz.com.test',
          farmerName: 'J Parkinson',
          name: 'High Oustley Farm',
          orgEmail: 'highoustleyfarmm@mrafyeltsuohgihh.com.test',
          sbi: '118409263',
          userType: 'newUser'
        },
        redactionHistory: {},
        reference: 'IAHW-8ZPZ-8CLI',
        status: 'AGREED',
        statusHistory: [
          {
            status: 'AGREED',
            createdBy: 'admin',
            createdAt: expect.any(Date)
          }
        ],
        updateHistory: []
      }

      it('should create application when no previous application exists in repo', async () => {
        const mockResult = []
        jest.spyOn(appRepo, 'getApplicationsBySbi').mockResolvedValue(mockResult)
        jest.spyOn(appRepo, 'createApplication').mockResolvedValue({
          acknowledged: true,
          insertedId: '690e04e10341b23a7d3cb9e5'
        })

        await createApplication({
          applicationRequest: inputRequest,
          logger: mockLogger,
          db: {}
        })

        expect(mockLogger.setBindings).toHaveBeenCalledWith({
          sbi: '118409263'
        })
        expect(appRepo.createApplication).toHaveBeenCalledWith(
          expect.anything(),
          expectedApplication
        )
        expect(raiseApplicationStatusEvent).toHaveBeenCalledWith({
          message: 'New application has been created',
          application: {
            ...expectedApplication,
            id: '690e04e10341b23a7d3cb9e5'
          },
          raisedBy: 'admin',
          raisedOn: expect.any(Date)
        })
        expect(publishDocumentRequestEvent).toHaveBeenCalledWith(mockLogger, {
          email: 'jparkinsong@nosnikrapjz.com.test',
          farmerName: 'J Parkinson',
          crn: '1101489790',
          orgEmail: 'highoustleyfarmm@mrafyeltsuohgihh.com.test',
          name: 'High Oustley Farm',
          reference: 'IAHW-8ZPZ-8CLI',
          sbi: '118409263',
          startDate: expect.any(String),
          userType: 'newUser',
          scheme: 'ahwr'
        })
        expect(mockLogger.info).toHaveBeenCalledWith({
          event: {
            category: 'status: accepted sbi:118409263',
            outcome: 'true',
            reference: 'IAHW-8ZPZ-8CLI',
            type: 'process-application-api'
          }
        })
      })

      it('should create application when previous application exists but is not relevant in repo', async () => {
        const mockResult = [
          {
            reference: 'IAHW-8ZPZ-8CLI',
            data: {
              reference: 'IAHW-8ZPZ-8CLI',
              declaration: true,
              offerStatus: 'accepted',
              confirmCheckDetails: 'yes'
            },
            status: 'WITHDRAWN',
            createdAt: '2025-01-01T00:00:00Z'
          }
        ]
        jest.spyOn(appRepo, 'getApplicationsBySbi').mockResolvedValue(mockResult)
        jest.spyOn(appRepo, 'createApplication').mockResolvedValue({
          acknowledged: true,
          insertedId: '690e04e10341b23a7d3cb9e5'
        })

        await createApplication({
          applicationRequest: inputRequest,
          logger: mockLogger,
          db: {}
        })

        expect(mockLogger.setBindings).toHaveBeenCalledWith({
          sbi: '118409263'
        })
        expect(appRepo.createApplication).toHaveBeenCalledWith(
          expect.anything(),
          expectedApplication
        )
        expect(raiseApplicationStatusEvent).toHaveBeenCalledWith({
          message: 'New application has been created',
          application: {
            ...expectedApplication,
            id: '690e04e10341b23a7d3cb9e5'
          },
          raisedBy: 'admin',
          raisedOn: expect.any(Date)
        })
        expect(publishDocumentRequestEvent).toHaveBeenCalledWith(mockLogger, {
          email: 'jparkinsong@nosnikrapjz.com.test',
          farmerName: 'J Parkinson',
          crn: '1101489790',
          orgEmail: 'highoustleyfarmm@mrafyeltsuohgihh.com.test',
          name: 'High Oustley Farm',
          reference: 'IAHW-8ZPZ-8CLI',
          sbi: '118409263',
          startDate: expect.any(String),
          userType: 'newUser',
          scheme: 'ahwr'
        })
        expect(mockLogger.info).toHaveBeenCalledWith({
          event: {
            category: 'status: accepted sbi:118409263',
            outcome: 'true',
            reference: 'IAHW-8ZPZ-8CLI',
            type: 'process-application-api'
          }
        })
      })

      it('should create application in database, but not notify for document generation when not accepted', async () => {
        const mockResult = []
        jest.spyOn(appRepo, 'getApplicationsBySbi').mockResolvedValue(mockResult)
        jest.spyOn(appRepo, 'createApplication').mockResolvedValue({
          acknowledged: true,
          insertedId: '690e04e10341b23a7d3cb9e5'
        })

        await createApplication({
          applicationRequest: { ...inputRequest, offerStatus: 'rejected' },
          logger: mockLogger,
          db: {}
        })

        expect(mockLogger.setBindings).toHaveBeenCalledWith({
          sbi: '118409263'
        })
        const expectedApplicationNotAgreed = {
          ...expectedApplication,
          statusHistory: [
            {
              status: 'NOT_AGREED',
              createdBy: 'admin',
              createdAt: expect.any(Date)
            }
          ],
          data: {
            confirmCheckDetails: 'yes',
            declaration: true,
            offerStatus: 'rejected',
            reference: 'TEMP-8ZPZ-8CLI'
          },
          status: 'NOT_AGREED'
        }
        expect(appRepo.createApplication).toHaveBeenCalledWith(
          expect.anything(),
          expectedApplicationNotAgreed
        )
        expect(raiseApplicationStatusEvent).toHaveBeenCalledWith({
          message: 'New application has been created',
          application: {
            ...expectedApplicationNotAgreed,
            id: '690e04e10341b23a7d3cb9e5'
          },
          raisedBy: 'admin',
          raisedOn: expect.any(Date)
        })
        expect(publishDocumentRequestEvent).toHaveBeenCalledTimes(0)
        expect(mockLogger.info).toHaveBeenCalledWith({
          event: {
            category: 'status: rejected sbi:118409263',
            outcome: 'true',
            reference: 'IAHW-8ZPZ-8CLI',
            type: 'process-application-api'
          }
        })
      })
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
            id: '0e4f55ea-ed42-4139-9c46-c75ba63b0742',
            cph: '12/345/6789',
            name: 'EventTester',
            reasons: ['uniqueHealthNeeds'],
            version: 2
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

  describe('getApplication', () => {
    const db = {}

    it('should return OW application when application exists in db', async () => {
      const mockResult = {
        reference: 'AHWR-B571-6E79',
        createdAt: new Date('2023-09-21T21:11:02.776Z'),
        updatedAt: new Date('2024-11-20T13:51:24.283Z'),
        createdBy: 'admin',
        updatedBy: 'admin',
        data: {
          vetName: 'Mr CowWhisperer',
          vetRcvs: '1208642',
          urnResult: '355981',
          visitDate: new Date('2023-11-10T00:00:00.000Z'),
          dateOfClaim: new Date('2023-11-23T20:17:43.694Z'),
          declaration: true,
          offerStatus: 'accepted',
          whichReview: 'beef',
          dateOfTesting: new Date('2023-11-10T00:00:00.000Z'),
          detailsCorrect: 'yes',
          eligibleSpecies: 'yes',
          confirmCheckDetails: 'yes'
        },
        organisation: {
          sbi: '123456789',
          name: 'Mr madeup',
          email: 'karengilberta@trebligneraky.com.test',
          address:
            'Forest View Farm,PAYHEMBURY,CLAYTONS FARM,LITTLE LONDON,NEWBURY,GL3 4RA,United Kingdom',
          orgEmail: 'burdassfrz@rfssadrubj.com.test',
          farmerName: 'Karen Gilbert'
        },
        status: 'READY_TO_PAY',
        statusHistory: [],
        updateHistory: [],
        contactHistory: [
          {
            id: '7e4dca92-2ee8-4420-8efc-eec7daafd26b',
            field: 'email',
            newValue: 'karengilberta@trebligneraky.com.test',
            oldValue: 'notreal@madeitup.com',
            createdAt: new Date('2024-11-20T13:51:24.291Z')
          }
        ],
        redactionHistory: {},
        flags: [],
        claimed: false,
        eligiblePiiRedaction: true
      }
      owAppRepo.getOWApplication.mockResolvedValue(mockResult)

      const result = await getApplication({
        db,
        logger: mockLogger,
        applicationReference: 'AHWR-B571-6E79'
      })

      expect(mockLogger.setBindings).toHaveBeenCalledWith({
        applicationReference: 'AHWR-B571-6E79'
      })
      expect(owAppRepo.getOWApplication).toHaveBeenCalledWith(db, 'AHWR-B571-6E79')
      expect(result).toEqual({
        type: 'VV',
        reference: 'AHWR-B571-6E79',
        createdAt: new Date('2023-09-21T21:11:02.776Z'),
        data: {
          vetName: 'Mr CowWhisperer',
          vetRcvs: '1208642',
          urnResult: '355981',
          visitDate: new Date('2023-11-10T00:00:00.000Z'),
          dateOfClaim: new Date('2023-11-23T20:17:43.694Z'),
          declaration: true,
          offerStatus: 'accepted',
          whichReview: 'beef',
          dateOfTesting: new Date('2023-11-10T00:00:00.000Z'),
          detailsCorrect: 'yes',
          eligibleSpecies: 'yes',
          confirmCheckDetails: 'yes'
        },
        organisation: {
          sbi: '123456789',
          name: 'Mr madeup',
          email: 'karengilberta@trebligneraky.com.test',
          address:
            'Forest View Farm,PAYHEMBURY,CLAYTONS FARM,LITTLE LONDON,NEWBURY,GL3 4RA,United Kingdom',
          orgEmail: 'burdassfrz@rfssadrubj.com.test',
          farmerName: 'Karen Gilbert'
        },
        status: 'READY_TO_PAY',
        statusHistory: [],
        updateHistory: [],
        contactHistory: [
          {
            id: '7e4dca92-2ee8-4420-8efc-eec7daafd26b',
            field: 'email',
            newValue: 'karengilberta@trebligneraky.com.test',
            oldValue: 'notreal@madeitup.com',
            createdAt: new Date('2024-11-20T13:51:24.291Z')
          }
        ],
        flags: [],
        eligiblePiiRedaction: true,
        redacted: false
      })
    })

    it('should throw Boom.notFound when OW application does not exist in db', async () => {
      owAppRepo.getOWApplication.mockResolvedValue(null)

      await expect(
        getApplication({
          db,
          logger: mockLogger,
          applicationReference: 'AHWR-B571-6E79'
        })
      ).rejects.toThrow('Application not found')
    })

    it('should return NW application when application exists in db', async () => {
      const createdAt = new Date()
      const mockResult = {
        status: 'AGREED',
        reference: 'IAHW-G3CL-V59P',
        data: {
          reference: 'TEMP-AAAA-AAAA',
          declaration: true,
          offerStatus: 'accepted',
          confirmCheckDetails: 'yes'
        },
        organisation: {
          name: 'Fake org name',
          farmerName: 'Fake farmer name',
          email: 'fake.farmer.email@example.com.test',
          sbi: '123456789',
          address: '1 fake street,fake town,United Kingdom',
          orgEmail: 'fake.org.email@example.com.test'
        },
        createdAt,
        statusHistory: [
          {
            status: 'AGREED',
            createdBy: 'admin',
            createdAt: new Date('2025-04-02T08:46:19.637Z')
          }
        ],
        updateHistory: [],
        contactHistory: [],
        flags: [
          {
            id: '0b401d15-b594-4bce-851a-0f676f1ce5a6',
            note: "User did not agree with multi herds T&C's",
            deleted: true,
            createdAt: new Date('2025-04-30T10:42:04.707Z'),
            createdBy: 'Rob Catton (EqualExperts)',
            deletedAt: new Date('2025-04-30T10:50:55.169Z'),
            deletedBy: 'Rob Catton (EqualExperts)',
            appliesToMh: true,
            deletedNote: "User has changed their mind and accepted the T&C's"
          }
        ],
        eligiblePiiRedaction: true
      }
      appRepo.getApplication.mockResolvedValue(mockResult)

      const result = await getApplication({
        db,
        logger: mockLogger,
        applicationReference: 'IAHW-G3CL-V59P'
      })

      expect(mockLogger.setBindings).toHaveBeenCalledWith({
        applicationReference: 'IAHW-G3CL-V59P'
      })
      expect(appRepo.getApplication).toHaveBeenCalledWith({
        db,
        reference: 'IAHW-G3CL-V59P'
      })
      expect(result).toEqual({
        type: 'EE',
        status: 'AGREED',
        reference: 'IAHW-G3CL-V59P',
        data: {
          reference: 'TEMP-AAAA-AAAA',
          declaration: true,
          offerStatus: 'accepted',
          confirmCheckDetails: 'yes'
        },
        organisation: {
          name: 'Fake org name',
          farmerName: 'Fake farmer name',
          email: 'fake.farmer.email@example.com.test',
          sbi: '123456789',
          address: '1 fake street,fake town,United Kingdom',
          orgEmail: 'fake.org.email@example.com.test'
        },
        createdAt,
        statusHistory: [
          {
            status: 'AGREED',
            createdBy: 'admin',
            createdAt: new Date('2025-04-02T08:46:19.637Z')
          }
        ],
        updateHistory: [],
        contactHistory: [],
        flags: [
          {
            id: '0b401d15-b594-4bce-851a-0f676f1ce5a6',
            note: "User did not agree with multi herds T&C's",
            deleted: true,
            createdAt: new Date('2025-04-30T10:42:04.707Z'),
            createdBy: 'Rob Catton (EqualExperts)',
            deletedAt: new Date('2025-04-30T10:50:55.169Z'),
            deletedBy: 'Rob Catton (EqualExperts)',
            appliesToMh: true,
            deletedNote: "User has changed their mind and accepted the T&C's"
          }
        ],
        eligiblePiiRedaction: true
      })
    })

    it('should throw Boom.notFound when NW application does not exist in db', async () => {
      appRepo.getApplication.mockResolvedValue(undefined)

      await expect(
        getApplication({
          db,
          logger: mockLogger,
          applicationReference: 'EE999'
        })
      ).rejects.toEqual(
        expect.objectContaining({
          isBoom: true,
          message: 'Application not found'
        })
      )
    })
  })
})
