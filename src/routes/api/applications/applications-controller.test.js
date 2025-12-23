import {
  createApplication,
  getApplications,
  getClaims,
  getHerds,
  getApplication
} from './applications-service.js'
import {
  createApplicationHandler,
  getApplicationsHandler,
  getApplicationClaimsHandler,
  getApplicationHerdsHandler,
  getApplicationHandler,
  updateEligibleForPiiRedactionHandler,
  updateApplicationDataHandler
} from './applications-controller.js'
import Boom from '@hapi/boom'
import { StatusCodes } from 'http-status-codes'
import { updateApplication } from '../../../repositories/application-repository.js'
import {
  findOWApplication,
  updateOWApplication
} from '../../../repositories/ow-application-repository.js'
import { claimDataUpdateEvent } from '../../../event-publisher/claim-data-update-event.js'

jest.mock('./applications-service.js')
jest.mock('../../../repositories/application-repository.js')
jest.mock('../../../repositories/ow-application-repository.js')
jest.mock('../../../event-publisher/claim-data-update-event.js')

describe('applications-controller', () => {
  const mockLogger = {
    error: jest.fn(),
    setBindings: jest.fn()
  }
  const mockDb = {}
  const mockH = {
    response: jest.fn().mockReturnThis(),
    code: jest.fn().mockReturnThis(),
    takeover: jest.fn().mockReturnThis()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createApplicationHandler', () => {
    const mockRequest = {
      payload: {
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
        }
      },
      logger: mockLogger,
      db: mockDb
    }

    it('should return 200 and the created application when successful', async () => {
      const mockApplication = { applicationReference: 'IAHW-XYZ-123' }
      createApplication.mockResolvedValue(mockApplication)

      const result = await createApplicationHandler(mockRequest, mockH)

      expect(createApplication).toHaveBeenCalledWith({
        applicationRequest: mockRequest.payload,
        logger: mockLogger,
        db: mockDb
      })
      expect(mockH.response).toHaveBeenCalledWith(mockApplication)
      expect(mockH.code).toHaveBeenCalledWith(StatusCodes.OK)
      expect(result).toBe(mockH)
    })

    it('should return 500 and log error when error occurs', async () => {
      const mockError = new Error('Database failure')
      createApplication.mockRejectedValue(mockError)

      await expect(createApplicationHandler(mockRequest, mockH)).rejects.toThrow(
        Boom.internal(mockError)
      )

      expect(mockLogger.error).toHaveBeenCalledWith(
        {
          error: mockError,
          event: {
            type: 'exception',
            severity: 'error',
            category: 'failed-save'
          }
        },
        'Failed to create application'
      )
    })
  })

  describe('getApplicationsHandler', () => {
    const mockRequest = {
      query: {
        sbi: '123456789'
      },
      logger: mockLogger,
      db: mockDb
    }

    it('should return 200 and list of applications when successful', async () => {
      const mockApplications = [{ reference: 'IAHW-AAA-001' }]
      getApplications.mockResolvedValue(mockApplications)

      const result = await getApplicationsHandler(mockRequest, mockH)

      expect(getApplications).toHaveBeenCalledWith({
        sbi: '123456789',
        logger: mockLogger,
        db: mockDb
      })
      expect(mockH.response).toHaveBeenCalledWith(mockApplications)
      expect(mockH.code).toHaveBeenCalledWith(StatusCodes.OK)
      expect(result).toBe(mockH)
    })

    it('should return 500 and log error when error occurs', async () => {
      const mockError = new Error('Failed to fetch apps')
      getApplications.mockRejectedValue(mockError)

      await expect(getApplicationsHandler(mockRequest, mockH)).rejects.toThrow(
        Boom.internal(mockError)
      )

      expect(mockLogger.error).toHaveBeenCalledWith(
        {
          error: mockError,
          event: {
            type: 'exception',
            severity: 'error',
            category: 'failed-retrieve'
          }
        },
        'Failed to get applications'
      )
    })
  })

  describe('getApplicationClaimsHandler', () => {
    const mockRequest = {
      query: {
        typeOfLivestock: 'beef'
      },
      params: {
        applicationReference: 'IAHW-AAA-001'
      },
      logger: mockLogger,
      db: mockDb
    }

    it('should return 200 and list of claims when successful', async () => {
      const mockApplications = [{ reference: 'IAHW-AAA-001' }]
      getClaims.mockResolvedValue(mockApplications)

      const result = await getApplicationClaimsHandler(mockRequest, mockH)

      expect(getClaims).toHaveBeenCalledWith({
        db: mockDb,
        logger: mockLogger,
        applicationReference: 'IAHW-AAA-001',
        typeOfLivestock: 'beef'
      })
      expect(mockH.response).toHaveBeenCalledWith(mockApplications)
      expect(mockH.code).toHaveBeenCalledWith(StatusCodes.OK)
      expect(result).toBe(mockH)
    })

    it('should return 500 and log error when error occurs', async () => {
      const mockError = new Error('Failed to fetch claims')
      getClaims.mockRejectedValue(mockError)

      await expect(getApplicationClaimsHandler(mockRequest, mockH)).rejects.toThrow(
        Boom.internal(mockError)
      )

      expect(mockLogger.error).toHaveBeenCalledWith(
        {
          error: mockError,
          event: {
            type: 'exception',
            severity: 'error',
            category: 'failed-retrieve'
          }
        },
        'Failed to get application claims'
      )
    })
  })

  describe('getApplicationHerdsHandler', () => {
    const mockRequest = {
      query: {
        species: 'beef'
      },
      params: {
        applicationReference: 'IAHW-AAA-001'
      },
      logger: mockLogger,
      db: mockDb
    }

    it('should return 200 and list of herds when successful', async () => {
      const mockHerds = [
        {
          id: '85eb8e4a-c00f-4094-967b-87e77858f54f',
          version: 1,
          name: 'Sheep herd 1',
          cph: 'someCph',
          reasons: ['reasonOne', 'reasonTwo'],
          species: 'sheep'
        },
        {
          id: 'e5215e0c-cc52-4f34-9348-88203c5acb75',
          version: 1,
          name: 'Sheep herd 2',
          cph: 'someCph',
          reasons: ['reasonOne', 'reasonTwo'],
          species: 'sheep'
        }
      ]
      getHerds.mockResolvedValue(mockHerds)

      const result = await getApplicationHerdsHandler(mockRequest, mockH)

      expect(getHerds).toHaveBeenCalledWith({
        db: mockDb,
        logger: mockLogger,
        applicationReference: 'IAHW-AAA-001',
        species: 'beef'
      })
      expect(mockH.response).toHaveBeenCalledWith(mockHerds)
      expect(mockH.code).toHaveBeenCalledWith(StatusCodes.OK)
      expect(result).toBe(mockH)
    })

    it('should return 500 and log error when error occurs', async () => {
      const mockError = new Error('Failed to fetch herds')
      getHerds.mockRejectedValue(mockError)

      await expect(getApplicationHerdsHandler(mockRequest, mockH)).rejects.toThrow(
        Boom.internal(mockError)
      )

      expect(mockLogger.error).toHaveBeenCalledWith(
        {
          error: mockError,
          event: {
            type: 'exception',
            severity: 'error',
            category: 'failed-retrieve'
          }
        },
        'Failed to get application herds'
      )
    })
  })

  describe('getApplicationHandler', () => {
    const mockRequest = {
      params: {
        applicationReference: 'IAHW-AAA-001'
      },
      logger: mockLogger,
      db: mockDb
    }

    it('should return 200 and application when successful', async () => {
      const mockApplication = {
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
      getApplication.mockResolvedValue(mockApplication)

      const result = await getApplicationHandler(mockRequest, mockH)

      expect(getApplication).toHaveBeenCalledWith({
        db: mockDb,
        logger: mockLogger,
        applicationReference: 'IAHW-AAA-001'
      })
      expect(mockH.response).toHaveBeenCalledWith(mockApplication)
      expect(mockH.code).toHaveBeenCalledWith(StatusCodes.OK)
      expect(result).toBe(mockH)
    })

    it('should return 500 and log error when error occurs', async () => {
      const mockError = new Error('Failed to fetch application')
      getApplication.mockRejectedValue(mockError)

      await expect(getApplicationHandler(mockRequest, mockH)).rejects.toThrow(
        Boom.internal(mockError)
      )

      expect(mockLogger.error).toHaveBeenCalledWith(
        {
          error: mockError,
          event: {
            type: 'exception',
            severity: 'error',
            category: 'failed-retrieve'
          }
        },
        'Failed to get application'
      )
    })
  })

  describe('updateEligibleForPiiRedactionHandler', () => {
    const mockRequest = {
      payload: {
        eligiblePiiRedaction: true,
        note: 'updated note',
        user: 'admin'
      },
      params: {
        ref: 'IAHW-AAA1-0012'
      },
      logger: mockLogger,
      db: mockDb
    }

    it('should return 204 when NW application found and updated successfully', async () => {
      const mockApplication = {
        reference: 'IAHW-AAA1-0012',
        status: 'AGREED',
        eligiblePiiRedaction: false
      }
      getApplication.mockResolvedValueOnce(mockApplication)
      updateApplication.mockResolvedValueOnce()

      const result = await updateEligibleForPiiRedactionHandler(mockRequest, mockH)

      expect(getApplication).toHaveBeenCalledWith({
        db: mockDb,
        logger: mockLogger,
        applicationReference: 'IAHW-AAA1-0012'
      })

      expect(updateApplication).toHaveBeenCalledWith({
        db: mockDb,
        newValue: true,
        note: 'updated note',
        oldValue: false,
        reference: 'IAHW-AAA1-0012',
        updatedAt: expect.any(Date),
        updatedPropertyPath: 'eligiblePiiRedaction',
        user: 'admin'
      })

      expect(mockH.code).toHaveBeenCalledWith(StatusCodes.NO_CONTENT)
      expect(result).toBe(mockH)
    })

    it('should return 204 when OW application found and updated successfully', async () => {
      const mockApplication = {
        reference: 'AHWR-AAA1-0012',
        status: 'AGREED',
        eligiblePiiRedaction: false
      }
      getApplication.mockResolvedValueOnce(mockApplication)
      updateOWApplication.mockResolvedValueOnce()

      const result = await updateEligibleForPiiRedactionHandler(
        {
          ...mockRequest,
          params: {
            ref: 'AHWR-AAA1-0012'
          }
        },
        mockH
      )

      expect(getApplication).toHaveBeenCalledWith({
        db: mockDb,
        logger: mockLogger,
        applicationReference: 'AHWR-AAA1-0012'
      })

      expect(updateOWApplication).toHaveBeenCalledWith({
        db: mockDb,
        newValue: true,
        note: 'updated note',
        oldValue: false,
        reference: 'AHWR-AAA1-0012',
        updatedAt: expect.any(Date),
        updatedPropertyPath: 'eligiblePiiRedaction',
        user: 'admin'
      })

      expect(mockH.code).toHaveBeenCalledWith(StatusCodes.NO_CONTENT)
      expect(result).toBe(mockH)
    })

    it('should return 404 when no application was found', async () => {
      getApplication.mockResolvedValueOnce(null)

      const result = await updateEligibleForPiiRedactionHandler(
        {
          ...mockRequest,
          params: {
            ref: 'AHWR-AAA1-0012'
          }
        },
        mockH
      )

      expect(getApplication).toHaveBeenCalledWith({
        db: mockDb,
        logger: mockLogger,
        applicationReference: 'AHWR-AAA1-0012'
      })

      expect(updateOWApplication).not.toHaveBeenCalled()

      expect(mockH.code).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(result).toBe(mockH)
    })

    it('should return 204 and perform no update when application found but update value is the same as current', async () => {
      const mockApplication = {
        reference: 'IAHW-AAA1-0012',
        status: 'AGREED',
        eligiblePiiRedaction: true
      }
      getApplication.mockResolvedValueOnce(mockApplication)

      const result = await updateEligibleForPiiRedactionHandler(mockRequest, mockH)

      expect(getApplication).toHaveBeenCalledWith({
        db: mockDb,
        logger: mockLogger,
        applicationReference: 'IAHW-AAA1-0012'
      })

      expect(updateApplication).not.toHaveBeenCalled()

      expect(mockH.code).toHaveBeenCalledWith(StatusCodes.NO_CONTENT)
      expect(result).toBe(mockH)
    })
  })

  describe('updateApplicationDataHandler', () => {
    function getMockRequestForUpdatedValue(updatedValue) {
      return {
        params: {
          reference: 'AHWR-OLDS-KOOL'
        },
        payload: {
          ...updatedValue,
          note: 'updated note',
          user: 'Admin'
        },
        logger: mockLogger,
        db: mockDb
      }
    }

    afterAll(() => {
      jest.clearAllMocks()
    })

    test('when application not found, return 404', async () => {
      findOWApplication.mockResolvedValueOnce(null)

      const result = await updateApplicationDataHandler(
        getMockRequestForUpdatedValue({ vetName: 'updated person' }),
        mockH
      )

      expect(mockH.code).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(result).toBe(mockH)
      expect(updateOWApplication).toHaveBeenCalledTimes(0)
    })

    test('when application found data successfully updated for vetName', async () => {
      const existingData = {
        vetName: 'old person',
        visitDate: '2021-01-01',
        vetRcvs: '123456'
      }
      findOWApplication.mockResolvedValueOnce({
        reference: 'AHWR-OLDS-KOOL',
        createdBy: 'admin',
        createdAt: new Date(),
        data: existingData,
        organisation: {
          sbi: '123456789'
        }
      })
      const result = await updateApplicationDataHandler(
        getMockRequestForUpdatedValue({ vetName: 'updated person' }),
        mockH
      )

      expect(mockH.code).toHaveBeenCalledWith(StatusCodes.NO_CONTENT)
      expect(result).toBe(mockH)
      expect(updateOWApplication).toHaveBeenCalledTimes(1)
      expect(updateOWApplication).toHaveBeenCalledWith({
        db: mockDb,
        reference: 'AHWR-OLDS-KOOL',
        updatedPropertyPath: 'data.vetName',
        newValue: 'updated person',
        oldValue: 'old person',
        note: 'updated note',
        user: 'Admin',
        updatedAt: expect.any(Date)
      })
      expect(claimDataUpdateEvent).toHaveBeenCalledWith(
        {
          applicationReference: 'AHWR-OLDS-KOOL',
          newValue: 'updated person',
          note: 'updated note',
          oldValue: 'old person',
          reference: 'AHWR-OLDS-KOOL',
          updatedProperty: 'vetName'
        },
        'application-vetName',
        'Admin',
        expect.any(Date),
        '123456789'
      )
    })

    test('when application found data successfully added for vetName', async () => {
      const existingData = {
        visitDate: '2021-01-01',
        vetRcvs: '123456'
      }
      findOWApplication.mockResolvedValueOnce({
        reference: 'AHWR-OLDS-KOOL',
        createdBy: 'admin',
        createdAt: new Date(),
        data: existingData,
        organisation: {
          sbi: '123456789'
        }
      })
      const result = await updateApplicationDataHandler(
        getMockRequestForUpdatedValue({ vetName: 'updated person' }),
        mockH
      )

      expect(mockH.code).toHaveBeenCalledWith(StatusCodes.NO_CONTENT)
      expect(result).toBe(mockH)
      expect(updateOWApplication).toHaveBeenCalledTimes(1)
      expect(updateOWApplication).toHaveBeenCalledWith({
        db: mockDb,
        reference: 'AHWR-OLDS-KOOL',
        updatedPropertyPath: 'data.vetName',
        newValue: 'updated person',
        oldValue: '',
        note: 'updated note',
        user: 'Admin',
        updatedAt: expect.any(Date)
      })
      expect(claimDataUpdateEvent).toHaveBeenCalledWith(
        {
          applicationReference: 'AHWR-OLDS-KOOL',
          newValue: 'updated person',
          note: 'updated note',
          oldValue: '',
          reference: 'AHWR-OLDS-KOOL',
          updatedProperty: 'vetName'
        },
        'application-vetName',
        'Admin',
        expect.any(Date),
        '123456789'
      )
    })

    test('when application found data successfully updated for visitDate', async () => {
      const existingData = {
        vetName: 'old person',
        visitDate: new Date('2021-01-01'),
        vetRcvs: '123456'
      }
      findOWApplication.mockResolvedValueOnce({
        reference: 'AHWR-OLDS-KOOL',
        createdBy: 'admin',
        createdAt: new Date(),
        data: existingData,
        organisation: {
          sbi: '123456789'
        }
      })

      const result = await updateApplicationDataHandler(
        getMockRequestForUpdatedValue({ visitDate: new Date('2025-06-21') }),
        mockH
      )

      expect(mockH.code).toHaveBeenCalledWith(StatusCodes.NO_CONTENT)
      expect(result).toBe(mockH)
      expect(updateOWApplication).toHaveBeenCalledTimes(1)
      expect(updateOWApplication).toHaveBeenCalledWith({
        db: mockDb,
        reference: 'AHWR-OLDS-KOOL',
        updatedPropertyPath: 'data.visitDate',
        newValue: new Date('2025-06-21'),
        oldValue: new Date('2021-01-01'),
        note: 'updated note',
        user: 'Admin',
        updatedAt: expect.any(Date)
      })
      expect(claimDataUpdateEvent).toHaveBeenCalledWith(
        {
          applicationReference: 'AHWR-OLDS-KOOL',
          newValue: new Date('2025-06-21'),
          note: 'updated note',
          oldValue: new Date('2021-01-01'),
          reference: 'AHWR-OLDS-KOOL',
          updatedProperty: 'visitDate'
        },
        'application-visitDate',
        'Admin',
        expect.any(Date),
        '123456789'
      )
    })

    test('successfully update vetRcvs in application', async () => {
      const existingData = {
        vetName: 'old person',
        visitDate: '2021-01-01',
        vetRcvs: '1234567'
      }
      findOWApplication.mockResolvedValueOnce({
        reference: 'AHWR-OLDS-KOOL',
        createdBy: 'admin',
        createdAt: new Date(),
        data: existingData,
        organisation: {
          sbi: '123456789'
        }
      })
      const result = await updateApplicationDataHandler(
        getMockRequestForUpdatedValue({ vetRcvs: '7654321' }),
        mockH
      )

      expect(mockH.code).toHaveBeenCalledWith(StatusCodes.NO_CONTENT)
      expect(result).toBe(mockH)
      expect(updateOWApplication).toHaveBeenCalledTimes(1)
      expect(updateOWApplication).toHaveBeenCalledWith({
        db: mockDb,
        reference: 'AHWR-OLDS-KOOL',
        updatedPropertyPath: 'data.vetRcvs',
        newValue: '7654321',
        oldValue: '1234567',
        note: 'updated note',
        user: 'Admin',
        updatedAt: expect.any(Date)
      })
      expect(claimDataUpdateEvent).toHaveBeenCalledWith(
        {
          applicationReference: 'AHWR-OLDS-KOOL',
          newValue: '7654321',
          note: 'updated note',
          oldValue: '1234567',
          reference: 'AHWR-OLDS-KOOL',
          updatedProperty: 'vetRcvs'
        },
        'application-vetRcvs',
        'Admin',
        expect.any(Date),
        '123456789'
      )
    })

    test('when value is not changed return 204 without updating application data', async () => {
      const existingData = {
        vetName: 'old person'
      }
      findOWApplication.mockResolvedValueOnce({
        reference: 'AHWR-OLDS-KOOL',
        createdBy: 'admin',
        createdAt: new Date(),
        data: existingData,
        organisation: {
          sbi: '123456789'
        }
      })
      const result = await updateApplicationDataHandler(
        getMockRequestForUpdatedValue({ vetName: 'old person' }),
        mockH
      )

      expect(mockH.code).toHaveBeenCalledWith(StatusCodes.NO_CONTENT)
      expect(result).toBe(mockH)
      expect(updateOWApplication).not.toHaveBeenCalled()
    })
  })
})
