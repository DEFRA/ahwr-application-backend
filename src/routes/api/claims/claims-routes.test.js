import { Server } from '@hapi/hapi'
import { claimHandlers } from './claims-routes.js'
import { createClaimHandler, isURNUniqueHandler, getClaimHandler } from './claims-controller.js'
import { updateClaimStatus, getClaimByReference } from '../../../repositories/claim-repository.js'
import { getApplication } from '../../../repositories/application-repository.js'
import { raiseClaimEvents } from '../../../event-publisher/index.js'
import { ObjectId } from 'mongodb'

jest.mock('./claims-controller.js')
jest.mock('../../../repositories/claim-repository.js')
jest.mock('../../../repositories/application-repository.js')
jest.mock('../../../event-publisher/index.js')

const mockLogger = {
  info: jest.fn(() => {}),
  warn: jest.fn(() => {}),
  error: jest.fn(() => {}),
  debug: jest.fn(() => {}),
  setBindings: jest.fn(() => {})
}
const mockDb = jest.fn()

describe('claims-routes', () => {
  let server

  beforeAll(async () => {
    server = new Server()
    server.route(claimHandlers)
    server.decorate('request', 'logger', mockLogger)
    server.decorate('request', 'db', mockDb)
    await server.initialize()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/claims', () => {
    it('should validate payload and call correct handler', async () => {
      const payload = {
        applicationReference: 'IAHW-AAAA-AAAA',
        sbi: '123456789',
        typeOfLivestock: 'beef',
        claimType: 'review'
      }

      createClaimHandler.mockImplementation(async (_, h) => {
        return h.response({ success: true }).code(200)
      })

      const res = await server.inject({
        method: 'POST',
        url: '/api/claims',
        payload
      })

      expect(res.statusCode).toBe(200)
      expect(res.result).toEqual({ success: true })
      expect(createClaimHandler).toHaveBeenCalledTimes(1)
      expect(createClaimHandler.mock.calls[0][0].payload).toEqual(payload)
    })

    it('should handle errors from handler', async () => {
      createClaimHandler.mockImplementation(async () => {
        throw new Error('Database error')
      })

      const res = await server.inject({
        method: 'POST',
        url: '/api/claims',
        payload: { applicationReference: 'IAHW-AAAA-AAAA' }
      })

      expect(res.statusCode).toBe(500)
    })
  })

  describe('POST /api/claims/is-urn-unique', () => {
    it('should validate payload and call correct handler', async () => {
      const payload = {
        sbi: '123456789',
        laboratoryURN: 'URN34567ddd'
      }
      isURNUniqueHandler.mockImplementation(async (_, h) => {
        return h.response({ isURNUnique: true }).code(200)
      })

      const res = await server.inject({
        method: 'POST',
        url: '/api/claims/is-urn-unique',
        payload
      })

      expect(res.statusCode).toBe(200)
      expect(res.result).toEqual({ isURNUnique: true })
      expect(isURNUniqueHandler).toHaveBeenCalledTimes(1)
      expect(isURNUniqueHandler.mock.calls[0][0].payload).toEqual(payload)
    })

    it('should handle errors from handler', async () => {
      const payload = {
        sbi: '123456789',
        laboratoryURN: 'URN34567ddd'
      }
      isURNUniqueHandler.mockImplementation(async () => {
        throw new Error('Database error')
      })

      const res = await server.inject({
        method: 'POST',
        url: '/api/claims/is-urn-unique',
        payload
      })

      expect(res.statusCode).toBe(500)
    })
  })

  describe('GET /api/claims/{reference}', () => {
    it('should validate payload and call correct handler', async () => {
      const mockResult = {
        applicationReference: 'IAHW-G3CL-V59P',
        createdAt: '2025-04-24T08:24:24.092Z',
        data: {
          amount: 522,
          claimType: 'R',
          dateOfTesting: '2025-04-24T00:00:00.000Z',
          dateOfVisit: '2025-04-25T00:00:00.000Z',
          laboratoryURN: 'w5436346ret',
          numberAnimalsTested: '10',
          speciesNumbers: 'yes',
          testResults: 'negative',
          typeOfLivestock: 'beef',
          vetRCVSNumber: '1111111',
          vetsName: 'Mr C test'
        },
        herd: {},
        reference: 'REBC-VA4R-TRL7',
        status: 'IN_CHECK',
        statusHistory: [],
        type: 'REVIEW',
        updateHistory: [
          {
            createdAt: '2025-04-25T13:05:39.937Z',
            createdBy: 'Carroll, Aaron',
            eventType: 'claim-vetsName',
            id: 'e3d320b7-b2cf-469a-903f-ead7587d98e9',
            newValue: 'Mr C test',
            note: 'Updated to check event',
            oldValue: 'Mr B Test',
            updatedProperty: 'vetsName'
          }
        ]
      }

      getClaimHandler.mockImplementation(async (_, h) => {
        return h.response(mockResult).code(200)
      })

      const res = await server.inject({
        method: 'GET',
        url: '/api/claims/REBC-VA4R-TRL7'
      })

      expect(res.statusCode).toBe(200)
      expect(res.result).toEqual(mockResult)
      expect(getClaimHandler).toHaveBeenCalledTimes(1)
    })

    it('should handle errors from handler', async () => {
      getClaimHandler.mockImplementation(async () => {
        throw new Error('Database error')
      })

      const res = await server.inject({
        method: 'GET',
        url: '/api/claims/REBC-VA4R-TRL7'
      })

      expect(res.statusCode).toBe(500)
    })
  })

  describe('PUT /api/claims/update-by-reference', () => {
    test.each([{ status: 'IN_CHECK' }, { status: 'READY_TO_PAY' }, { status: 'REJECTED' }])(
      'Update claim status to status $status',
      async ({ status }) => {
        const options = {
          method: 'PUT',
          url: '/api/claims/update-by-reference',
          payload: {
            reference: 'REBC-J9AR-KILQ',
            status,
            user: 'admin'
          }
        }

        getClaimByReference.mockResolvedValueOnce({
          reference: 'REBC-J9AR-KILQ',
          applicationReference: 'AHWR-KJLI-2678',
          data: {
            typeOfLivestock: 'sheep',
            claimType: 'R',
            reviewTestResults: 'positive'
          }
        })
        updateClaimStatus.mockResolvedValueOnce({
          _id: new ObjectId('691df90a35d046309ef9fe45'),
          reference: 'REBC-J9AR-KILQ',
          status,
          updatedAt: new Date('2025-04-24T08:24:24.092Z'),
          updatedBy: 'user'
        })
        getApplication.mockResolvedValueOnce({
          organisation: {
            sbi: '106705779',
            crn: '1100014934',
            frn: '1102569649'
          }
        })

        const res = await server.inject(options)

        expect(res.statusCode).toBe(200)
        expect(raiseClaimEvents).toHaveBeenCalledWith(
          {
            message: 'Claim has been updated',
            claim: {
              _id: new ObjectId('691df90a35d046309ef9fe45'),
              id: '691df90a35d046309ef9fe45',
              reference: 'REBC-J9AR-KILQ',
              status,
              updatedAt: new Date('2025-04-24T08:24:24.092Z'),
              updatedBy: 'user'
            },
            note: undefined,
            raisedBy: 'user',
            raisedOn: new Date('2025-04-24T08:24:24.092Z')
          },
          '106705779'
        )
        // if (statusId === 9) {
        //   expect(sendMessage).toHaveBeenCalledWith(
        //     {
        //       reference: 'REBC-J9AR-KILQ',
        //       sbi: '106705779',
        //       whichReview: 'sheep',
        //       isEndemics: true,
        //       claimType: 'R',
        //       reviewTestResults: 'positive',
        //       frn: '1102569649'
        //     },
        //     'uk.gov.ffc.ahwr.submit.payment.request', expect.any(Object), { sessionId: expect.any(String) })
        // }
        // expect(sendMessage).toHaveBeenCalledWith(
        //   {
        //     crn: '1100014934',
        //     sbi: '106705779',
        //     agreementReference: 'AHWR-KJLI-2678',
        //     claimReference: 'REBC-J9AR-KILQ',
        //     claimStatus: statusId,
        //     claimType: 'R',
        //     typeOfLivestock: 'sheep',
        //     reviewTestResults: 'positive',
        //     dateTime: expect.any(Date),
        //     herdName: 'Unnamed flock'
        //   },
        //   'uk.gov.ffc.ahwr.claim.status.update', expect.any(Object), { sessionId: expect.any(String) }
        // )
      }
    )

    test('should update claim when application does not exist', async () => {
      const options = {
        method: 'PUT',
        url: '/api/claims/update-by-reference',
        payload: {
          reference: 'REBC-J9AR-KILQ',
          status: 'READY_TO_PAY',
          user: 'admin',
          note: 'updating status'
        }
      }

      getClaimByReference.mockResolvedValueOnce({
        reference: 'REBC-J9AR-KILQ',
        applicationReference: 'AHWR-KJLI-2678',
        data: {
          typeOfLivestock: 'sheep',
          claimType: 'R',
          reviewTestResults: 'positive'
        }
      })
      getApplication.mockResolvedValueOnce({})
      updateClaimStatus.mockResolvedValueOnce({
        _id: new ObjectId('691df90a35d046309ef9fe45'),
        reference: 'REBC-J9AR-KILQ',
        status: 'READY_TO_PAY',
        updatedAt: new Date('2025-04-24T08:24:24.092Z'),
        updatedBy: 'admin'
      })

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(updateClaimStatus).toHaveBeenCalledWith({
        db: mockDb,
        reference: 'REBC-J9AR-KILQ',
        status: 'READY_TO_PAY',
        user: 'admin',
        updatedAt: expect.any(Date)
      })

      expect(raiseClaimEvents).toHaveBeenCalledWith(
        {
          message: 'Claim has been updated',
          claim: {
            _id: new ObjectId('691df90a35d046309ef9fe45'),
            id: '691df90a35d046309ef9fe45',
            updatedBy: 'admin',
            reference: 'REBC-J9AR-KILQ',
            status: 'READY_TO_PAY',
            updatedAt: new Date('2025-04-24T08:24:24.092Z')
          },
          note: 'updating status',
          raisedBy: 'admin',
          raisedOn: new Date('2025-04-24T08:24:24.092Z')
        },
        undefined
      )
      // expect(sendMessage).toHaveBeenCalledWith(
      //   {
      //     reference: 'REBC-J9AR-KILQ',
      //     whichReview: 'sheep',
      //     isEndemics: true,
      //     claimType: 'R',
      //     reviewTestResults: 'positive'
      //   },
      //   'uk.gov.ffc.ahwr.submit.payment.request', expect.any(Object), { sessionId: expect.any(String) })
      // expect(sendMessage).toHaveBeenCalledWith(
      //   {
      //     agreementReference: 'AHWR-KJLI-2678',
      //     claimReference: 'REBC-J9AR-KILQ',
      //     claimStatus: 9,
      //     claimType: 'R',
      //     typeOfLivestock: 'sheep',
      //     reviewTestResults: 'positive',
      //     dateTime: expect.any(Date),
      //     herdName: 'Unnamed flock'
      //   },
      //   'uk.gov.ffc.ahwr.claim.status.update', expect.any(Object), { sessionId: expect.any(String) }
      // )
    })

    test('Update claim should failed when claim is not exist', async () => {
      const options = {
        method: 'PUT',
        url: '/api/claims/update-by-reference',
        payload: {
          reference: 'AHWR-0F5D-4A26',
          status: 'READY_TO_PAY',
          user: 'admin'
        }
      }

      getClaimByReference.mockResolvedValueOnce(null)

      const res = await server.inject(options)

      expect(res.statusCode).toBe(404)
    })

    // test('should update claim and submit payment request when piHunt is yes', async () => {
    //   isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => { return true })
    //   isMultipleHerdsUserJourney.mockImplementation(() => { return false })
    //   const options = {
    //     method: 'PUT',
    //     url: '/api/claims/update-by-reference',
    //     payload: {
    //       reference: 'REBC-J9AR-KILQ',
    //       status: 9,
    //       user: 'admin',
    //       note: 'updating status'
    //     }
    //   }
    //   getClaimByReference.mockResolvedValue({
    //     dataValues: {
    //       reference: 'REBC-J9AR-KILQ',
    //       applicationReference: 'AHWR-KJLI-2678',
    //       data: {
    //         typeOfLivestock: 'sheep',
    //         claimType: 'R',
    //         reviewTestResults: 'positive',
    //         piHunt: 'yes',
    //         piHuntAllAnimals: 'yes'
    //       }
    //     }
    //   })
    //   getApplication.mockResolvedValue({
    //     dataValues: {
    //       data: {
    //         organisation: {
    //           sbi: '106705779',
    //           crn: '1100014934',
    //           frn: '1102569649'
    //         }
    //       }
    //     }
    //   })
    //   const res = await server.inject(options)

    //   expect(res.statusCode).toBe(200)
    //   expect(updateClaimStatus).toHaveBeenCalledWith({
    //     reference: 'REBC-J9AR-KILQ',
    //     sbi: '106705779',
    //     statusId: 9,
    //     updatedBy: 'admin'
    //   }, 'updating status', expect.any(Object))
    // expect(sendMessage).toHaveBeenCalledWith(
    //   {
    //     agreementReference: 'AHWR-KJLI-2678',
    //     claimReference: 'REBC-J9AR-KILQ',
    //     claimStatus: 9,
    //     typeOfLivestock: 'sheep',
    //     claimType: 'R',
    //     dateTime: expect.any(Date),
    //     sbi: '106705779',
    //     crn: '1100014934',
    //     reviewTestResults: 'positive',
    //     herdName: 'Unnamed flock'
    //   },
    //   'uk.gov.ffc.ahwr.claim.status.update', expect.any(Object), { sessionId: expect.any(String) }
    // )
    // expect(sendMessage).toHaveBeenCalledWith(
    //   {
    //     reference: 'REBC-J9AR-KILQ',
    //     whichReview: 'sheep',
    //     isEndemics: true,
    //     claimType: 'R',
    //     reviewTestResults: 'positive',
    //     optionalPiHuntValue: 'yesPiHunt',
    //     frn: '1102569649',
    //     sbi: '106705779'
    //   },
    //   'uk.gov.ffc.ahwr.submit.payment.request', expect.any(Object), { sessionId: expect.any(String) })
    // test('should update claim and submit payment request when piHunt is yes and piHuntRecommended is yes', async () => {
    //   // isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => { return true })
    //   // isMultipleHerdsUserJourney.mockImplementation(() => { return false })
    //   const options = {
    //     method: 'PUT',
    //     url: '/api/claims/update-by-reference',
    //     payload: {
    //       reference: 'REBC-J9AR-KILQ',
    //       status: 9,
    //       user: 'admin',
    //       note: 'updating status'
    //     }
    //   }
    //   getClaimByReference.mockResolvedValueOnce({
    //     dataValues: {
    //       reference: 'REBC-J9AR-KILQ',
    //       applicationReference: 'AHWR-KJLI-2678',
    //       data: {
    //         typeOfLivestock: 'beef',
    //         claimType: 'E',
    //         reviewTestResults: 'negative',
    //         piHunt: 'yes',
    //         piHuntAllAnimals: 'yes',
    //         piHuntRecommended: 'yes',
    //         testResults: 'negative'
    //       }
    //     }
    //   })
    //   getApplication.mockResolvedValueOnce({
    //     dataValues: {
    //       data: {
    //         organisation: {
    //           sbi: '106705779',
    //           crn: '1100014934',
    //           frn: '1102569649'
    //         }
    //       }
    //     }
    //   })
    //   const res = await server.inject(options)

    //   expect(res.statusCode).toBe(200)
    //   expect(updateClaimByReference).toHaveBeenCalledWith({
    //     reference: 'REBC-J9AR-KILQ',
    //     sbi: '106705779',
    //     statusId: 9,
    //     updatedBy: 'admin'
    //   }, 'updating status', expect.any(Object))
    //   expect(sendMessage).toHaveBeenCalledWith(
    //     {
    //       agreementReference: 'AHWR-KJLI-2678',
    //       claimReference: 'REBC-J9AR-KILQ',
    //       claimStatus: 9,
    //       typeOfLivestock: 'beef',
    //       claimType: 'E',
    //       dateTime: expect.any(Date),
    //       sbi: '106705779',
    //       crn: '1100014934',
    //       piHuntRecommended: 'yes',
    //       piHuntAllAnimals: 'yes',
    //       reviewTestResults: 'negative',
    //       herdName: 'Unnamed herd'
    //     },
    //     'uk.gov.ffc.ahwr.claim.status.update', expect.any(Object), { sessionId: expect.any(String) }
    //   )
    //   expect(sendMessage).toHaveBeenCalledWith(
    //     {
    //       reference: 'REBC-J9AR-KILQ',
    //       whichReview: 'beef',
    //       isEndemics: true,
    //       claimType: 'E',
    //       reviewTestResults: 'negative',
    //       optionalPiHuntValue: 'yesPiHunt',
    //       frn: '1102569649',
    //       sbi: '106705779'
    //     },
    //     'uk.gov.ffc.ahwr.submit.payment.request', expect.any(Object), { sessionId: expect.any(String) })
    // })

    // test('should update claim status and send status update message when old world review test results', async () => {
    //   isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => { return true })
    //   isMultipleHerdsUserJourney.mockImplementation(() => { return false })
    //   const options = {
    //     method: 'PUT',
    //     url: '/api/claims/update-by-reference',
    //     payload: {
    //       reference: 'REBC-J9AR-KILQ',
    //       status: 9,
    //       user: 'admin',
    //       note: 'updating status'
    //     }
    //   }
    //   getClaimByReference.mockResolvedValueOnce({
    //     dataValues: {
    //       reference: 'REBC-J9AR-KILQ',
    //       applicationReference: 'AHWR-KJLI-2678',
    //       data: {
    //         typeOfLivestock: 'beef',
    //         claimType: 'E',
    //         vetVisitsReviewTestResults: 'negative',
    //         piHunt: 'yes',
    //         piHuntAllAnimals: 'yes',
    //         piHuntRecommended: 'yes',
    //         testResults: 'negative'
    //       }
    //     }
    //   })
    //   getApplication.mockResolvedValueOnce({
    //     dataValues: {
    //       data: {
    //         organisation: {
    //           sbi: '106705779',
    //           crn: '1100014934',
    //           frn: '1102569649'
    //         }
    //       }
    //     }
    //   })
    //   const res = await server.inject(options)

    //   expect(res.statusCode).toBe(200)
    //   expect(updateClaimByReference).toHaveBeenCalledWith({
    //     reference: 'REBC-J9AR-KILQ',
    //     sbi: '106705779',
    //     statusId: 9,
    //     updatedBy: 'admin'
    //   }, 'updating status', expect.any(Object))
    //   expect(sendMessage).toHaveBeenCalledWith(
    //     {
    //       agreementReference: 'AHWR-KJLI-2678',
    //       claimReference: 'REBC-J9AR-KILQ',
    //       claimStatus: 9,
    //       typeOfLivestock: 'beef',
    //       claimType: 'E',
    //       dateTime: expect.any(Date),
    //       sbi: '106705779',
    //       crn: '1100014934',
    //       piHuntRecommended: 'yes',
    //       piHuntAllAnimals: 'yes',
    //       reviewTestResults: 'negative',
    //       herdName: 'Unnamed herd'
    //     },
    //     'uk.gov.ffc.ahwr.claim.status.update', expect.any(Object), { sessionId: expect.any(String) }
    //   )
    //   expect(sendMessage).toHaveBeenCalledWith(
    //     {
    //       reference: 'REBC-J9AR-KILQ',
    //       whichReview: 'beef',
    //       isEndemics: true,
    //       claimType: 'E',
    //       reviewTestResults: 'negative',
    //       optionalPiHuntValue: 'yesPiHunt',
    //       frn: '1102569649',
    //       sbi: '106705779'
    //     },
    //     'uk.gov.ffc.ahwr.submit.payment.request', expect.any(Object), { sessionId: expect.any(String) })
    // })

    // test('should update claim and submit payment request when optionalPiHunt is enabled and piHunt is no', async () => {
    //   isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => { return true })
    //   isMultipleHerdsUserJourney.mockImplementation(() => { return false })
    //   const options = {
    //     method: 'PUT',
    //     url: '/api/claims/update-by-reference',
    //     payload: {
    //       reference: 'REBC-J9AR-KILQ',
    //       status: 9,
    //       user: 'admin',
    //       note: 'updating status'
    //     }
    //   }
    //   getClaimByReference.mockResolvedValueOnce({
    //     dataValues: {
    //       reference: 'REBC-J9AR-KILQ',
    //       applicationReference: 'AHWR-KJLI-2678',
    //       data: {
    //         typeOfLivestock: 'sheep',
    //         claimType: 'R',
    //         reviewTestResults: 'positive',
    //         piHunt: 'no',
    //         piHuntAllAnimals: 'no'
    //       }
    //     }
    //   })
    //   getApplication.mockResolvedValueOnce({
    //     dataValues: {
    //       data: {
    //         organisation: {
    //           sbi: '106705779',
    //           crn: '1100014934',
    //           frn: '1102569649'
    //         }
    //       }
    //     }
    //   })
    //   const res = await server.inject(options)

    //   expect(res.statusCode).toBe(200)
    //   expect(updateClaimByReference).toHaveBeenCalledWith({
    //     reference: 'REBC-J9AR-KILQ',
    //     sbi: '106705779',
    //     statusId: 9,
    //     updatedBy: 'admin'
    //   }, 'updating status', expect.any(Object))
    //   expect(sendMessage).toHaveBeenCalledWith(
    //     {
    //       agreementReference: 'AHWR-KJLI-2678',
    //       claimReference: 'REBC-J9AR-KILQ',
    //       claimStatus: 9,
    //       typeOfLivestock: 'sheep',
    //       claimType: 'R',
    //       dateTime: expect.any(Date),
    //       sbi: '106705779',
    //       crn: '1100014934',
    //       reviewTestResults: 'positive',
    //       herdName: 'Unnamed flock'
    //     },
    //     'uk.gov.ffc.ahwr.claim.status.update', expect.any(Object), { sessionId: expect.any(String) }
    //   )
    //   expect(sendMessage).toHaveBeenCalledWith(
    //     {
    //       reference: 'REBC-J9AR-KILQ',
    //       whichReview: 'sheep',
    //       isEndemics: true,
    //       claimType: 'R',
    //       reviewTestResults: 'positive',
    //       optionalPiHuntValue: 'noPiHunt',
    //       frn: '1102569649',
    //       sbi: '106705779'
    //     },
    //     'uk.gov.ffc.ahwr.submit.payment.request', expect.any(Object), { sessionId: expect.any(String) })
    // })

    // test('should update claim and submit payment request when optionalPiHunt is not enabled', async () => {
    //   const options = {
    //     method: 'PUT',
    //     url: '/api/claims/update-by-reference',
    //     payload: {
    //       reference: 'REBC-J9AR-KILQ',
    //       status: 9,
    //       user: 'admin',
    //       note: 'updating status'
    //     }
    //   }
    //   getClaimByReference.mockResolvedValueOnce({
    //     dataValues: {
    //       reference: 'REBC-J9AR-KILQ',
    //       applicationReference: 'AHWR-KJLI-2678',
    //       data: {
    //         typeOfLivestock: 'sheep',
    //         claimType: 'R',
    //         reviewTestResults: 'positive',
    //         piHunt: 'yes',
    //         piHuntAllAnimals: 'yes'
    //       }
    //     }
    //   })
    //   getApplication.mockResolvedValueOnce({
    //     dataValues: {
    //       data: {
    //         organisation: {
    //           sbi: '106705779',
    //           crn: '1100014934',
    //           frn: '1102569649'
    //         }
    //       }
    //     }
    //   })
    //   const res = await server.inject(options)

    //   expect(res.statusCode).toBe(200)
    //   expect(updateClaimByReference).toHaveBeenCalledWith({
    //     reference: 'REBC-J9AR-KILQ',
    //     sbi: '106705779',
    //     statusId: 9,
    //     updatedBy: 'admin'
    //   }, 'updating status', expect.any(Object))
    //   expect(sendMessage).toHaveBeenCalledWith(
    //     {
    //       agreementReference: 'AHWR-KJLI-2678',
    //       claimReference: 'REBC-J9AR-KILQ',
    //       claimStatus: 9,
    //       typeOfLivestock: 'sheep',
    //       claimType: 'R',
    //       dateTime: expect.any(Date),
    //       sbi: '106705779',
    //       crn: '1100014934',
    //       reviewTestResults: 'positive',
    //       herdName: 'Unnamed flock'
    //     },
    //     'uk.gov.ffc.ahwr.claim.status.update', expect.any(Object), { sessionId: expect.any(String) }
    //   )
    //   expect(sendMessage).toHaveBeenCalledWith(
    //     {
    //       reference: 'REBC-J9AR-KILQ',
    //       whichReview: 'sheep',
    //       isEndemics: true,
    //       claimType: 'R',
    //       reviewTestResults: 'positive',
    //       frn: '1102569649',
    //       sbi: '106705779'
    //     },
    //     'uk.gov.ffc.ahwr.submit.payment.request', expect.any(Object), { sessionId: expect.any(String) })
    // })

    // test('should update claim when herd exists', async () => {
    //   const options = {
    //     method: 'PUT',
    //     url: '/api/claims/update-by-reference',
    //     payload: {
    //       reference: 'REBC-J9AR-KILQ',
    //       status: 9,
    //       user: 'admin',
    //       note: 'updating status'
    //     }
    //   }
    //   getClaimByReference.mockResolvedValueOnce({
    //     dataValues: {
    //       reference: 'REBC-J9AR-KILQ',
    //       applicationReference: 'AHWR-KJLI-2678',
    //       data: {
    //         typeOfLivestock: 'beef',
    //         claimType: 'E',
    //         reviewTestResults: 'negative',
    //         piHuntAllAnimals: 'yes',
    //         piHuntRecommended: 'yes',
    //         testResults: 'negative'
    //       },
    //       herd: {
    //         id: 'a2e35593-aba9-4732-9da3-2f01ef9be888',
    //         cph: '22/333/4444',
    //         species: 'beef',
    //         version: 1,
    //         herdName: 'Commercial herd',
    //         createdAt: '2025-06-12T13:08:27.21397+00:00',
    //         createdBy: 'admin',
    //         isCurrent: true,
    //         updatedAt: null,
    //         updatedBy: null,
    //         herdReasons: [
    //           'differentBreed',
    //           'uniqueHealthNeeds'
    //         ],
    //         applicationReference: 'IAHW-Y2W3-2N2X'
    //       }
    //     }
    //   })
    //   getApplication.mockResolvedValueOnce({
    //     dataValues: {
    //       data: {
    //         organisation: {
    //           sbi: '106705779',
    //           crn: '1100014934',
    //           frn: '1102569649'
    //         }
    //       }
    //     }
    //   })

    //   const res = await server.inject(options)

    //   expect(res.statusCode).toBe(200)
    //   expect(updateClaimByReference).toHaveBeenCalledWith({
    //     reference: 'REBC-J9AR-KILQ',
    //     sbi: '106705779',
    //     statusId: 9,
    //     updatedBy: 'admin'
    //   }, 'updating status', expect.any(Object))
    //   expect(sendMessage).toHaveBeenCalledWith(
    //     {
    //       agreementReference: 'AHWR-KJLI-2678',
    //       claimReference: 'REBC-J9AR-KILQ',
    //       claimStatus: 9,
    //       typeOfLivestock: 'beef',
    //       claimType: 'E',
    //       dateTime: expect.any(Date),
    //       sbi: '106705779',
    //       crn: '1100014934',
    //       piHuntRecommended: 'yes',
    //       piHuntAllAnimals: 'yes',
    //       reviewTestResults: 'negative',
    //       herdName: 'Commercial herd'
    //     },
    //     'uk.gov.ffc.ahwr.claim.status.update', expect.any(Object), { sessionId: expect.any(String) }
    //   )
    //   expect(sendMessage).toHaveBeenCalledWith(
    //     {
    //       reference: 'REBC-J9AR-KILQ',
    //       whichReview: 'beef',
    //       isEndemics: true,
    //       claimType: 'E',
    //       reviewTestResults: 'negative',
    //       frn: '1102569649',
    //       sbi: '106705779'
    //     },
    //     'uk.gov.ffc.ahwr.submit.payment.request', expect.any(Object), { sessionId: expect.any(String) })
    // })

    test('Update claim should failed when reference is not provieded', async () => {
      const options = {
        method: 'PUT',
        url: '/api/claims/update-by-reference',
        payload: {
          status: 9,
          user: 'admin'
        }
      }
      getClaimByReference.mockResolvedValueOnce({})

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
    })
  })
})
