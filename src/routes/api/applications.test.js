// import { applicationStatus } from '../../../../../app/constants'
// import {
// searchApplications,
// getApplication,
// updateApplicationStatus
// findApplication,
// updateApplicationData,
// updateEligiblePiiRedaction
// } from '../../repositories/application-repository'
// import { getAllFlags, getFlagsForApplication } from '../../../../../app/repositories/flag-repository'
// import { sendMessage } from '../../../../../app/messaging/send-message'
// import { processApplicationApi } from '../../../../../app/messaging/application/process-application'
// import { getHerdsByAppRefAndSpecies } from '../../../../../app/repositories/herd-repository'
import {
  findOWApplication,
  updateOWApplication,
  getOWApplication,
  updateOWApplicationStatus
} from '../../repositories/ow-application-repository'
import { applicationHandlers } from './applications'
import Hapi from '@hapi/hapi'
import { claimDataUpdateEvent } from '../../event-publisher/claim-data-update-event'
import { raiseApplicationStatusEvent } from '../../event-publisher'
import { ObjectId } from 'mongodb'

jest.mock('../../repositories/application-repository')
jest.mock('../../repositories/ow-application-repository')
// jest.mock('../../../../../app/repositories/flag-repository')
// jest.mock('../../../../../app/repositories/herd-repository')
// jest.mock('../../../../../app/messaging/send-message')
// jest.mock('../../../../../app/messaging/application/process-application')
// jest.mock('uuid', () => ({ v4: () => '123456789' }))
jest.mock('../../event-publisher/claim-data-update-event')
// const data = { organisation: { sbi: '1231' }, whichReview: 'sheep' }
jest.mock('../../event-publisher')

const mockLogger = {
  info: jest.fn(() => {}),
  warn: jest.fn(() => {}),
  error: jest.fn(() => {}),
  debug: jest.fn(() => {}),
  setBindings: jest.fn(() => {})
}
const mockDb = jest.fn()

const createServer = async () => {
  const server = Hapi.server({
    port: 0,
    host: 'localhost'
  })

  server.route(applicationHandlers)

  await server.initialize()
  server.decorate('request', 'logger', mockLogger)
  server.decorate('request', 'db', mockDb)

  return server
}

describe('Applications test', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
  })

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  // const reference = 'IAHW-U6ZE-5R5E'
  // const flags = [
  //   {
  //     id: '333c18ef-fb26-4beb-ac87-c483fc886fea',
  //     applicationReference: 'IAHW-U6ZE-5R5E',
  //     sbi: '123456789',
  //     note: 'Flag this please',
  //     createdBy: 'Tom',
  //     createdAt: '2025-04-09T11:59:54.075Z',
  //     appliesToMh: false,
  //     deletedAt: null,
  //     deletedBy: null
  //   },
  //   {
  //     id: '53dbbc6c-dd14-4d01-be11-ad288cb16b08',
  //     applicationReference: 'IAHW-U6ZE-5R5E',
  //     sbi: '123456789',
  //     note: 'Flag this please',
  //     createdBy: 'Ben',
  //     createdAt: '2025-04-09T12:01:23.322Z',
  //     appliesToMh: true,
  //     deletedAt: null,
  //     deletedBy: null
  //   }]

  // describe('POST /api/applications/search route', () => {
  //   const method = 'POST'
  //   const createdAt = new Date()
  //   searchApplications.mockResolvedValue({
  //     applications: [
  //       {
  //         toJSON: () => ({
  //           reference,
  //           createdBy: 'admin',
  //           createdAt,
  //           data,
  //           flags: [
  //             {
  //               appliesToMh: true
  //             }
  //           ]
  //         })
  //       }
  //     ],
  //     total: 1
  //   })

  //   getAllFlags.mockResolvedValue(flags)

  //   test.each([
  //     { search: { text: '444444444', type: 'sbi' } },
  //     { search: { text: 'AHWR-555A-FD6E', type: 'ref' } },
  //     { search: { text: 'applied', type: 'status' } },
  //     { search: { text: 'data inputted', type: 'status' } },
  //     { search: { text: 'claimed', type: 'status' } },
  //     { search: { text: 'check', type: 'status' } },
  //     { search: { text: 'accepted', type: 'status' } },
  //     { search: { text: 'rejected', type: 'status' } },
  //     { search: { text: 'paid', type: 'status' } },
  //     { search: { text: 'withdrawn', type: 'status' } },
  //     { search: { text: 'on hold', type: 'status' } }
  //   ])('returns success when post %p', async ({ search }) => {
  //     const options = {
  //       method,
  //       url: '/api/application/search',
  //       payload: { search }
  //     }

  //     const res = await server.inject(options)

  //     expect(res.statusCode).toBe(200)
  //     expect(searchApplications).toHaveBeenCalledTimes(1)
  //     expect(JSON.parse(res.payload)).toEqual({
  //       applications: [
  //         {
  //           createdAt: createdAt.toISOString(),
  //           createdBy: 'admin',
  //           data: {
  //             organisation: {
  //               sbi: '1231'
  //             },
  //             whichReview: 'sheep'
  //           },
  //           flags: [
  //             {
  //               appliesToMh: true
  //             }
  //           ],
  //           reference: 'IAHW-U6ZE-5R5E'
  //         }
  //       ],
  //       total: 1
  //     })
  //   })

  //   test.each([
  //     { search: { text: '333333333' } },
  //     { search: { text: '444444443' } },
  //     { search: { text: 'AHWR-555A-F5D5' } },
  //     { search: { text: '' } },
  //     { search: { text: undefined } }
  //   ])(
  //     'returns success with error message when no data found',
  //     async ({ search }) => {
  //       searchApplications.mockReturnValue({
  //         applications: [],
  //         total: 0
  //       })

  //       const options = {
  //         method,
  //         url: '/api/application/search',
  //         payload: { search }
  //       }
  //       const res = await server.inject(options)

  //       expect(res.statusCode).toBe(200)
  //       expect(searchApplications).toHaveBeenCalledTimes(1)
  //       const $ = JSON.parse(res.payload)
  //       expect($.total).toBe(0)
  //     }
  //   )

  //   test.each([
  //     { search: { text: '333333333' }, limit: 'abc', offset: 0 },
  //     { search: { text: '444444443' }, offset: 'abc', limit: 20 }
  //   ])(
  //     'returns 400 with error message for invalid input',
  //     async ({ search, limit, offset }) => {
  //       const options = {
  //         method,
  //         url: '/api/application/search',
  //         payload: { search, limit, offset }
  //       }
  //       const res = await server.inject(options)

  //       expect(res.statusCode).toBe(400)
  //     }
  //   )
  // })

  describe('PUT /api/applications/{ref} route', () => {
    test('returns 200 when new status is Withdrawn (2)', async () => {
      getOWApplication.mockResolvedValue({
        reference: 'IAHW-U6ZE-5R5E',
        createdBy: 'admin',
        createdAt: new Date(),
        data: {
          declaration: true
        },
        flags: [],
        status: 'AGREED'
      })
      updateOWApplicationStatus.mockResolvedValue({
        _id: new ObjectId('507f191e810c19729de860ea'),
        reference: 'IAHW-U6ZE-5R5E',
        createdBy: 'admin',
        createdAt: new Date('2025-03-02T08:46:19.637Z'),
        data: {
          declaration: true
        },
        flags: [],
        status: 'AGREED',
        updatedBy: 'test',
        updatedAt: new Date('2025-04-02T08:46:19.637Z')
      })

      const options = {
        method: 'PUT',
        url: '/api/applications/IAHW-U6ZE-5R5E',
        payload: { status: 'WITHDRAWN', user: 'test', note: 'reason' }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(updateOWApplicationStatus).toHaveBeenCalledWith({
        db: mockDb,
        reference: 'IAHW-U6ZE-5R5E',
        status: 'WITHDRAWN',
        user: 'test',
        updatedAt: expect.any(Date)
      })
      expect(raiseApplicationStatusEvent).toHaveBeenCalledWith({
        message: 'Application has been updated',
        application: {
          _id: new ObjectId('507f191e810c19729de860ea'),
          id: '507f191e810c19729de860ea',
          reference: 'IAHW-U6ZE-5R5E',
          createdBy: 'admin',
          createdAt: new Date('2025-03-02T08:46:19.637Z'),
          data: {
            declaration: true
          },
          flags: [],
          status: 'AGREED',
          updatedBy: 'test',
          updatedAt: new Date('2025-04-02T08:46:19.637Z')
        },
        raisedBy: 'test',
        raisedOn: new Date('2025-04-02T08:46:19.637Z'),
        note: 'reason'
      })
    })

    test('returns 200 when new status is In Check (5)', async () => {
      getOWApplication.mockResolvedValue({
        reference: 'IAHW-U6ZE-5R5E',
        createdBy: 'admin',
        createdAt: new Date(),
        data: {
          declaration: true
        },
        flags: [],
        status: 'AGREED'
      })
      updateOWApplicationStatus.mockResolvedValue({
        _id: new ObjectId('507f191e810c19729de860ea'),
        reference: 'IAHW-U6ZE-5R5E',
        createdBy: 'admin',
        createdAt: new Date('2025-03-02T08:46:19.637Z'),
        data: {
          declaration: true
        },
        flags: [],
        status: 'IN_CHECK',
        updatedBy: 'test',
        updatedAt: new Date('2025-04-02T08:46:19.637Z')
      })

      const options = {
        method: 'PUT',
        url: '/api/applications/IAHW-U6ZE-5R5E',
        payload: { status: 'IN_CHECK', user: 'test', note: 'reason' }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(updateOWApplicationStatus).toHaveBeenCalledWith({
        db: mockDb,
        reference: 'IAHW-U6ZE-5R5E',
        status: 'IN_CHECK',
        user: 'test',
        updatedAt: expect.any(Date)
      })
      expect(raiseApplicationStatusEvent).toHaveBeenCalledWith({
        message: 'Application has been updated',
        application: {
          _id: new ObjectId('507f191e810c19729de860ea'),
          id: '507f191e810c19729de860ea',
          reference: 'IAHW-U6ZE-5R5E',
          createdBy: 'admin',
          createdAt: new Date('2025-03-02T08:46:19.637Z'),
          data: {
            declaration: true
          },
          flags: [],
          status: 'IN_CHECK',
          updatedBy: 'test',
          updatedAt: new Date('2025-04-02T08:46:19.637Z')
        },
        raisedBy: 'test',
        raisedOn: new Date('2025-04-02T08:46:19.637Z'),
        note: 'reason'
      })
    })

    test('returns 404 if application doesnt exist', async () => {
      getOWApplication.mockResolvedValue(undefined)

      const options = {
        method: 'PUT',
        url: '/api/applications/ABC-1234',
        payload: { status: 'IN_CHECK', user: 'test' }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(404)
      expect(getOWApplication).toHaveBeenCalledTimes(1)
    })

    test.each([
      { status: 'abc', user: null },
      { status: 'abc', user: 0 },
      { status: 5000, user: 'test' }
    ])('returns 400 with error message for invalid input', async ({ status, user }) => {
      const options = {
        method: 'PUT',
        url: '/api/applications/ABC-1234',
        payload: { status, user }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
    })
  })

  // describe('POST /api/applications/claim route', () => {
  //   const method = 'POST'

  //   test.each([
  //     {
  //       approved: false,
  //       user: 'test',
  //       reference,
  //       payment: 0,
  //       statusId: applicationStatus.rejected
  //     },
  //     {
  //       approved: true,
  //       user: 'test',
  //       reference,
  //       payment: 1,
  //       statusId: applicationStatus.readyToPay
  //     }
  //   ])(
  //     'returns 200 for valid input',
  //     async ({ approved, user, reference, payment, statusId }) => {
  //       getApplication.mockResolvedValue({
  //         dataValues: {
  //           reference,
  //           createdBy: 'admin',
  //           createdAt: new Date(),
  //           data,
  //           flags: []
  //         }
  //       })

  //       const options = {
  //         method,
  //         url: '/api/application/claim',
  //         payload: { approved, user, reference }
  //       }
  //       const res = await server.inject(options)

  //       expect(res.statusCode).toBe(200)
  //       expect(getApplication).toHaveBeenCalledTimes(1)
  //       expect(updateApplicationByReference).toHaveBeenCalledTimes(1)
  //       expect(updateApplicationByReference).toHaveBeenCalledWith({
  //         reference,
  //         statusId,
  //         updatedBy: user
  //       })
  //       expect(sendMessage).toHaveBeenCalledTimes(payment)
  //     }
  //   )

  //   test('returns a 200 when sending message fails, payment failure & status not updated', async () => {
  //     getApplication.mockResolvedValue({
  //       dataValues: {
  //         reference,
  //         createdBy: 'admin',
  //         createdAt: new Date(),
  //         data,
  //         flags: []
  //       }
  //     })
  //     sendMessage.mockImplementation(() => {
  //       throw new Error()
  //     })

  //     const options = {
  //       method,
  //       url: '/api/application/claim',
  //       payload: { approved: true, user: 'test', reference }
  //     }
  //     const res = await server.inject(options)

  //     expect(res.statusCode).toBe(200)
  //     expect(getApplication).toHaveBeenCalledTimes(1)
  //     expect(sendMessage).toHaveBeenCalledTimes(1)
  //     expect(updateApplicationByReference).toHaveBeenCalledTimes(0)
  //   })

  //   test('returns 404 when no application is found in the DB', async () => {
  //     getApplication.mockResolvedValue({ dataValues: null })

  //     const options = {
  //       method,
  //       url: '/api/application/claim',
  //       payload: { approved: true, user: 'test', reference }
  //     }
  //     const res = await server.inject(options)

  //     expect(res.statusCode).toBe(404)
  //     expect(getApplication).toHaveBeenCalledTimes(1)
  //   })

  //   test.each([
  //     { approved: false, user: 'test', reference: false },
  //     { approved: true, user: 0, reference: true },
  //     { approved: 'wrong', user: 'test', reference }
  //   ])(
  //     'returns 400 with error message for invalid input',
  //     async ({ approved, user, reference }) => {
  //       const options = {
  //         method,
  //         url: '/api/application/claim',
  //         payload: { approved, user, reference }
  //       }
  //       const res = await server.inject(options)

  //       expect(res.statusCode).toBe(400)
  //     }
  //   )
  // })

  // describe('POST /api/application/processor', () => {
  //   const options = {
  //     method: 'POST',
  //     url: '/api/application/processor',
  //     payload: {
  //       confirmCheckDetails: 'yes',
  //       whichReview: 'sheep',
  //       eligibleSpecies: 'yes',
  //       reference: 'AHWR-5C1C-DD6Z',
  //       declaration: true,
  //       offerStatus: 'accepted',
  //       organisation: {
  //         farmerName: 'Mr Farmer',
  //         name: 'My Amazing Farm',
  //         sbi: '112223',
  //         cph: '123/456/789',
  //         crn: '112223',
  //         address: '1 Example Road',
  //         email: 'business@email.com',
  //         isTest: true,
  //         userType: 'newUser'
  //       },
  //       type: 'VV'
  //     }
  //   }

  //   afterAll(() => {
  //     jest.clearAllMocks()
  //   })

  //   test('successfully submitting an application', async () => {
  //     const res = await server.inject(options)

  //     expect(res.statusCode).toBe(200)
  //     expect(processApplicationApi).toHaveBeenCalledTimes(1)
  //   })

  //   test('submitting an application fail', async () => {
  //     processApplicationApi.mockImplementation(async () => {
  //       throw new Error()
  //     })
  //     const res = await server.inject(options)
  //     expect(res.statusCode).toBe(400)
  //     expect(processApplicationApi).toHaveBeenCalledTimes(1)
  //   })
  // })

  describe('PUT /api/applications/{reference}/data', () => {
    function getOptionsForUpdatedValue(updatedValue) {
      return {
        method: 'put',
        url: '/api/applications/AHWR-OLDS-KOOL/data',
        payload: {
          ...updatedValue,
          note: 'updated note',
          user: 'Admin'
        }
      }
    }

    afterAll(() => {
      jest.clearAllMocks()
    })

    test('when payload missing required values, returns 400', async () => {
      const res = await server.inject({
        method: 'put',
        url: '/api/applications/AHWR-OLDS-KOOL/data'
      })

      expect(res.statusCode).toBe(400)
      expect(updateOWApplication).toHaveBeenCalledTimes(0)
    })

    test('when application not found, return 404', async () => {
      findOWApplication.mockResolvedValueOnce(null)
      const res = await server.inject(getOptionsForUpdatedValue({ vetName: 'updated person' }))

      expect(res.statusCode).toBe(404)
      expect(updateOWApplication).toHaveBeenCalledTimes(0)
    })

    test('successfully update vetName in application', async () => {
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
      const res = await server.inject(getOptionsForUpdatedValue({ vetName: 'updated person' }))

      expect(res.statusCode).toBe(204)
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
    })

    test('successfully add vetName in application', async () => {
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
      const res = await server.inject(getOptionsForUpdatedValue({ vetName: 'updated person' }))

      expect(res.statusCode).toBe(204)
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
    })

    test('successfully update visitDate in application', async () => {
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
      const res = await server.inject(getOptionsForUpdatedValue({ visitDate: '2025-06-21' }))

      expect(res.statusCode).toBe(204)
      expect(updateOWApplication).toHaveBeenCalledTimes(1)
      expect(updateOWApplication).toHaveBeenCalledWith({
        db: mockDb,
        reference: 'AHWR-OLDS-KOOL',
        updatedPropertyPath: 'data.visitDate',
        newValue: new Date('2025-06-21T00:00:00.000Z'),
        oldValue: new Date('2021-01-01'),
        note: 'updated note',
        user: 'Admin',
        updatedAt: expect.any(Date)
      })
    })

    test('successfully add visitDate in application', async () => {
      const existingData = {
        vetName: 'old person',
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
      const res = await server.inject(getOptionsForUpdatedValue({ visitDate: '2025-06-21' }))

      expect(res.statusCode).toBe(204)
      expect(updateOWApplication).toHaveBeenCalledTimes(1)
      expect(updateOWApplication).toHaveBeenCalledWith({
        db: mockDb,
        reference: 'AHWR-OLDS-KOOL',
        updatedPropertyPath: 'data.visitDate',
        newValue: new Date('2025-06-21T00:00:00.000Z'),
        oldValue: '',
        note: 'updated note',
        user: 'Admin',
        updatedAt: expect.any(Date)
      })
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
      const res = await server.inject(getOptionsForUpdatedValue({ vetRcvs: '7654321' }))

      expect(res.statusCode).toBe(204)
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
          reference: 'AHWR-OLDS-KOOL',
          updatedProperty: 'vetRcvs',
          newValue: '7654321',
          oldValue: '1234567',
          note: 'updated note'
        },
        'application-vetRcvs',
        'Admin',
        expect.any(Date),
        '123456789'
      )
    })

    test('successfully add vetRcvs in application', async () => {
      const existingData = {
        vetName: 'old person',
        visitDate: '2021-01-01'
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
      const res = await server.inject(getOptionsForUpdatedValue({ vetRcvs: '7654321' }))

      expect(res.statusCode).toBe(204)
      expect(updateOWApplication).toHaveBeenCalledTimes(1)
      expect(updateOWApplication).toHaveBeenCalledWith({
        db: mockDb,
        reference: 'AHWR-OLDS-KOOL',
        updatedPropertyPath: 'data.vetRcvs',
        newValue: '7654321',
        oldValue: '',
        note: 'updated note',
        user: 'Admin',
        updatedAt: expect.any(Date)
      })
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
      const res = await server.inject(getOptionsForUpdatedValue({ vetName: 'old person' }))

      expect(res.statusCode).toBe(204)
      expect(updateOWApplication).toHaveBeenCalledTimes(0)
    })
  })

  // describe('GET /api/application/{ref}/flag route', () => {
  //   test('returns flags when application flags exists', async () => {
  //     getFlagsForApplication.mockResolvedValueOnce(flags)
  //     const options = {
  //       method: 'GET',
  //       url: '/api/application/IAHW-U6ZE-5R5E/flag'
  //     }

  //     const res = await server.inject(options)

  //     expect(res.statusCode).toBe(200)
  //     expect(getFlagsForApplication).toHaveBeenCalledTimes(1)
  //     expect(JSON.parse(res.payload)).toEqual(flags)
  //   })

  //   test('returns no flags when application flags do not exist', async () => {
  //     getFlagsForApplication.mockResolvedValueOnce([])
  //     const options = {
  //       method: 'GET',
  //       url: '/api/application/IAHW-U6ZE-5R5E/flag'
  //     }

  //     const res = await server.inject(options)

  //     expect(res.statusCode).toBe(200)
  //     expect(getFlagsForApplication).toHaveBeenCalledTimes(1)
  //     expect(JSON.parse(res.payload)).toEqual([])
  //   })
  // })

  // describe('GET /api/application/{ref}/herds', () => {
  //   test('returns herds for valid application reference and species', async () => {
  //     getHerdsByAppRefAndSpecies.mockResolvedValueOnce([
  //       {
  //         id: 1,
  //         version: 1,
  //         herdName: 'Beef Herd',
  //         cph: '22/333/4444',
  //         herdReasons: ['one', 'two']
  //       }
  //     ])

  //     const res = await server.inject({
  //       method: 'get',
  //       url: '/api/application/IAHW-U6ZE-5R5E/herds?species=beef'
  //     })

  //     expect(res.statusCode).toBe(200)
  //     expect(JSON.parse(res.payload)).toEqual([{
  //       herdId: 1,
  //       herdVersion: 1,
  //       herdName: 'Beef Herd',
  //       cph: '22/333/4444',
  //       herdReasons: ['one', 'two']
  //     }])
  //   })

  //   test('returns 400 when species is not one of the valid types', async () => {
  //     const res = await server.inject({
  //       method: 'get',
  //       url: '/api/application/IAHW-U6ZE-5R5E/herds?species=goat'
  //     })

  //     expect(res.statusCode).toBe(400)
  //     expect(JSON.parse(res.payload)).toHaveProperty('err')
  //   })
  // })

  // describe('PUT /api/application/{ref}/eligible-pii-redaction', () => {
  //   test('updates pii redaction eligible when application exists', async () => {
  //     updateEligiblePiiRedaction.mockResolvedValueOnce()
  //     getApplication.mockResolvedValueOnce({
  //       dataValues: {
  //         reference: 'IAHW-U6ZE-5R5E'
  //       }
  //     })

  //     const res = await server.inject({
  //       method: 'put',
  //       url: '/api/application/IAHW-U6ZE-5R5E/eligible-pii-redaction',
  //       payload: {
  //         eligiblePiiRedaction: true,
  //         note: 'updated note',
  //         user: 'admin'
  //       }
  //     })

  //     expect(res.statusCode).toBe(200)
  //     expect(updateEligiblePiiRedaction).toHaveBeenCalledWith(
  //       'IAHW-U6ZE-5R5E', true, 'admin', 'updated note'
  //     )
  //   })

  //   test('returns 404 when application does not exist', async () => {
  //     updateEligiblePiiRedaction.mockResolvedValueOnce()
  //     getApplication.mockResolvedValueOnce({})

  //     const res = await server.inject({
  //       method: 'put',
  //       url: '/api/application/IAHW-U6ZE-5R5E/eligible-pii-redaction',
  //       payload: {
  //         eligiblePiiRedaction: true,
  //         note: 'updated note',
  //         user: 'admin'
  //       }
  //     })

  //     expect(res.statusCode).toBe(404)
  //     expect(updateEligiblePiiRedaction).toHaveBeenCalledWith(
  //       'IAHW-U6ZE-5R5E', true, 'admin', 'updated note'
  //     )
  //   })
  // })
})
