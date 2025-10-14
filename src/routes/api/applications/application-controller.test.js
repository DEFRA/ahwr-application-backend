import {
  createApplication,
  getApplications,
  getClaims
} from './application-service.js'
import {
  createApplicationHandler,
  getApplicationsHandler,
  getApplicationClaimsHandler
} from './application-controller.js'
import Boom from '@hapi/boom'
import { StatusCodes } from 'http-status-codes'

vi.mock('./application-service.js')

describe('application-controller', () => {
  const mockLogger = {
    error: vi.fn()
  }
  const mockDb = {}
  const mockH = {
    response: vi.fn().mockReturnThis(),
    code: vi.fn().mockReturnThis()
  }

  beforeEach(() => {
    vi.clearAllMocks()
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
      ).rejects.toThrowError(Boom.internal(mockError))

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

      await expect(
        getApplicationsHandler(mockRequest, mockH)
      ).rejects.toThrowError(Boom.internal(mockError))

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
      ).rejects.toThrowError(Boom.internal(mockError))

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: mockError },
        'Failed to get claims'
      )
    })
  })
})
