import {
  createFlagHandler,
  getAllFlagsHandler,
  deleteFlagHandler
} from './flags-controller.js'
import { StatusCodes } from 'http-status-codes'
import { getAllFlags } from '../../../repositories/flag-repository.js'
import {
  createFlag,
  deleteFlag,
  findApplication
} from '../../../repositories/application-repository.js'
import { isOWAppRef } from '../../../lib/context-helper.js'
import {
  createOWFlag,
  deleteOWFlag,
  findOWApplication
} from '../../../repositories/ow-application-repository.js'

jest.mock('../../../repositories/application-repository.js')
jest.mock('../../../repositories/ow-application-repository.js')
jest.mock('../../../repositories/flag-repository.js')
jest.mock('../../../lib/context-helper.js')

describe('flags-controller', () => {
  const mockLogger = {
    error: jest.fn(),
    info: jest.fn(),
    setBindings: jest.fn()
  }
  const mockDb = {}
  const mockH = {
    response: jest.fn().mockReturnThis(),
    code: jest.fn().mockReturnThis()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createFlagHandler', () => {
    const mockRequest = {
      payload: {
        user: 'Ken Kong',
        note: 'Flagging this application for review',
        appliesToMh: true
      },
      params: { ref: 'IAHW-AXYZ-1234' },
      logger: mockLogger,
      db: mockDb
    }

    it('should return 201 when successful for NW application - flag does not exist already', async () => {
      const mockApplication = {
        applicationReference: 'IAHW-AXYZ-1234',
        flags: []
      }
      isOWAppRef.mockReturnValueOnce(false)
      findApplication.mockReturnValueOnce(mockApplication)

      const result = await createFlagHandler(mockRequest, mockH)

      expect(createFlag).toHaveBeenCalledWith(mockDb, 'IAHW-AXYZ-1234', {
        id: expect.any(String),
        note: 'Flagging this application for review',
        createdAt: new Date(),
        createdBy: 'Ken Kong',
        appliesToMh: true,
        deleted: false
      })
      expect(mockH.response).toHaveBeenCalledWith()
      expect(mockH.code).toHaveBeenCalledWith(StatusCodes.CREATED)
      expect(result).toBe(mockH)
    })

    it('should return 201 when successful for OW application - flag does not exist already', async () => {
      const mockApplication = {
        applicationReference: 'AHWR-AXYZ-1234',
        flags: [{ deleted: true, appliesToMh: true }]
      }
      isOWAppRef.mockReturnValueOnce(true)
      findOWApplication.mockReturnValueOnce(mockApplication)

      const result = await createFlagHandler(
        {
          ...mockRequest,
          params: { ref: 'AHWR-AXYZ-1234' }
        },
        mockH
      )

      expect(createOWFlag).toHaveBeenCalledWith(mockDb, 'AHWR-AXYZ-1234', {
        id: expect.any(String),
        note: 'Flagging this application for review',
        createdAt: new Date(),
        createdBy: 'Ken Kong',
        appliesToMh: true,
        deleted: false
      })
      expect(mockH.response).toHaveBeenCalledWith()
      expect(mockH.code).toHaveBeenCalledWith(StatusCodes.CREATED)
      expect(result).toBe(mockH)
    })

    it('should return 204 when flag already exists', async () => {
      const mockApplication = {
        applicationReference: 'AHWR-AXYZ-1234',
        flags: [{ deleted: false, appliesToMh: true }]
      }
      isOWAppRef.mockReturnValueOnce(true)
      findOWApplication.mockReturnValueOnce(mockApplication)

      const result = await createFlagHandler(
        {
          ...mockRequest,
          params: { ref: 'AHWR-AXYZ-1234' }
        },
        mockH
      )

      expect(createOWFlag).toHaveBeenCalledTimes(0)

      expect(mockH.response).toHaveBeenCalledWith()
      expect(mockH.code).toHaveBeenCalledWith(StatusCodes.NO_CONTENT)
      expect(result).toBe(mockH)
    })

    it('should return 404 when NW application not found', async () => {
      const mockHTakeOver = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn().mockReturnThis(),
        takeover: jest.fn().mockReturnValueOnce('takeover')
      }

      isOWAppRef.mockReturnValueOnce(false)
      findApplication.mockReturnValueOnce(null)

      const result = await createFlagHandler(mockRequest, mockHTakeOver)

      expect(createFlag).toHaveBeenCalledTimes(0)

      expect(mockHTakeOver.response).toHaveBeenCalledWith('Not Found')
      expect(mockHTakeOver.code).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(result).toEqual('takeover')
    })

    it('should return 404 when OW application not found', async () => {
      const mockHTakeOver = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn().mockReturnThis(),
        takeover: jest.fn().mockReturnValueOnce('takeover')
      }

      isOWAppRef.mockReturnValueOnce(true)
      findOWApplication.mockReturnValueOnce(null)

      const result = await createFlagHandler(
        { ...mockRequest, params: { ref: 'AHWR-AXYZ-1234' } },
        mockHTakeOver
      )

      expect(createOWFlag).toHaveBeenCalledTimes(0)

      expect(mockHTakeOver.response).toHaveBeenCalledWith('Not Found')
      expect(mockHTakeOver.code).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(result).toEqual('takeover')
    })
  })

  describe('deleteFlagHandler', () => {
    const mockRequest = {
      payload: {
        user: 'Ken Kong',
        deletedNote: 'No longer applicable'
      },
      params: { flagId: 'ABC-1234' },
      logger: mockLogger,
      db: mockDb
    }

    it('should return 204 when successful, NW application flag', async () => {
      deleteFlag.mockReturnValueOnce(true)

      const result = await deleteFlagHandler(mockRequest, mockH)

      expect(deleteFlag).toHaveBeenCalledWith(
        mockDb,
        'ABC-1234',
        'Ken Kong',
        'No longer applicable'
      )
      expect(deleteOWFlag).toHaveBeenCalledTimes(0)
      expect(mockH.response).toHaveBeenCalledWith()
      expect(mockH.code).toHaveBeenCalledWith(StatusCodes.NO_CONTENT)
      expect(result).toBe(mockH)
    })
    it('should return 204 when successful, OW application flag', async () => {
      deleteFlag.mockReturnValueOnce(false)
      deleteOWFlag.mockReturnValueOnce(true)

      const result = await deleteFlagHandler(mockRequest, mockH)

      expect(deleteFlag).toHaveBeenCalledWith(
        mockDb,
        'ABC-1234',
        'Ken Kong',
        'No longer applicable'
      )
      expect(deleteOWFlag).toHaveBeenCalledWith(
        mockDb,
        'ABC-1234',
        'Ken Kong',
        'No longer applicable'
      )

      expect(mockH.response).toHaveBeenCalledWith()
      expect(mockH.code).toHaveBeenCalledWith(StatusCodes.NO_CONTENT)
      expect(result).toBe(mockH)
    })
    it('should return 404 when flag not found', async () => {
      const mockHTakeOver = {
        response: jest.fn().mockReturnThis(),
        code: jest.fn().mockReturnThis(),
        takeover: jest.fn().mockReturnValueOnce('takeover')
      }
      deleteFlag.mockReturnValueOnce(false)
      deleteOWFlag.mockReturnValueOnce(false)

      const result = await deleteFlagHandler(mockRequest, mockHTakeOver)

      expect(deleteFlag).toHaveBeenCalledWith(
        mockDb,
        'ABC-1234',
        'Ken Kong',
        'No longer applicable'
      )
      expect(deleteOWFlag).toHaveBeenCalledWith(
        mockDb,
        'ABC-1234',
        'Ken Kong',
        'No longer applicable'
      )

      expect(mockHTakeOver.response).toHaveBeenCalledWith('Not Found')
      expect(mockHTakeOver.code).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(result).toBe('takeover')
    })
  })

  describe('getAllFlagsHandler', () => {
    const mockRequest = {
      logger: mockLogger,
      db: mockDb
    }

    it('should return 200 and list of flags when successful', async () => {
      const mockFlags = [
        { applicationReference: 'IAHW-AAA-001', sbi: '123456789' },
        { applicationReference: 'AHWR-AAA-001', sbi: '123456987' }
      ]
      getAllFlags.mockResolvedValue(mockFlags)

      const result = await getAllFlagsHandler(mockRequest, mockH)

      expect(getAllFlags).toHaveBeenCalledWith(mockDb)
      expect(mockH.response).toHaveBeenCalledWith(mockFlags)
      expect(mockH.code).toHaveBeenCalledWith(StatusCodes.OK)
      expect(result).toBe(mockH)
    })
  })
})
