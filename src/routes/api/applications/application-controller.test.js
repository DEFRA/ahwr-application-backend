import {
  createApplication,
  getApplications,
  getClaims,
  getHerds,
  getApplication
} from './application-service.js'
import {
  createApplicationHandler,
  getApplicationsHandler,
  getApplicationClaimsHandler,
  getApplicationHerdsHandler,
  getApplicationHandler
} from './application-controller.js'
import Boom from '@hapi/boom'
import { StatusCodes } from 'http-status-codes'

jest.mock('./application-service.js')

describe('application-controller', () => {
  const mockLogger = {
    error: jest.fn()
  }
  const mockDb = {}
  const mockH = {
    response: jest.fn().mockReturnThis(),
    code: jest.fn().mockReturnThis()
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

      await expect(
        createApplicationHandler(mockRequest, mockH)
      ).rejects.toThrow(Boom.internal(mockError))

      expect(mockLogger.error).toHaveBeenCalledWith(
        { err: mockError },
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
        { error: mockError },
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

      await expect(
        getApplicationClaimsHandler(mockRequest, mockH)
      ).rejects.toThrow(Boom.internal(mockError))

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: mockError },
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

      await expect(
        getApplicationHerdsHandler(mockRequest, mockH)
      ).rejects.toThrow(Boom.internal(mockError))

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: mockError },
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
        { error: mockError },
        'Failed to get application'
      )
    })
  })
})
