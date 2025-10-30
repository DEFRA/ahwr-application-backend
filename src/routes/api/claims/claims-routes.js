import joi from 'joi'
import { v4 as uuid } from 'uuid'
import { sendMessage } from '../../../messaging/send-message.js'
import { config } from '../../../config/config.js'
import {
  piHunt,
  piHuntAllAnimals,
  testResults as testResultsConstant,
  livestockTypes,
  applicationStatus
} from '../../../constants/index.js'
import {
  getClaimByReference,
  updateClaimByReference,
  getByApplicationReference
} from '../../../repositories/claim-repository.js'
import { getApplication } from '../../../repositories/application-repository.js'
import { getAmount } from '../../../lib/getAmount.js'
import { searchPayloadSchema } from '../schema/search-payload.schema.js'
import { isVisitDateAfterPIHuntAndDairyGoLive } from '../../../lib/context-helper.js'
import { StatusCodes } from 'http-status-codes'
import {
  TYPE_OF_LIVESTOCK,
  UNNAMED_FLOCK,
  UNNAMED_HERD,
  claimType
} from 'ffc-ahwr-common-library'
import { searchClaims } from '../../../repositories/claim/claim-search-repository.js'
import {
  createClaimHandler,
  isURNUniqueHandler,
  getClaimHandler
} from './claims-controller.js'
import { messageQueueConfig } from '../../../config/message-queue.js'

const submitPaymentRequestMsgType = config.get('messageTypes')
const submitRequestQueue = messageQueueConfig.submitRequestQueue // TODO: get from main config
const messageGeneratorMsgType = config.get('messageTypes')
const messageGeneratorQueue = messageQueueConfig.messageGeneratorQueue // TODO: get from main config

const getUnnamedHerdValueByTypeOfLivestock = (typeOfLivestock) =>
  typeOfLivestock === TYPE_OF_LIVESTOCK.SHEEP ? UNNAMED_FLOCK : UNNAMED_HERD

export const claimHandlers = [
  {
    method: 'GET',
    path: '/api/claim/get-by-reference/{ref}',
    options: {
      validate: {
        params: joi.object({
          ref: joi.string().valid()
        })
      },
      handler: async (request, h) => {
        const claim = await getClaimByReference(request.db, request.params.ref)
        if (claim) {
          return h.response(claim).code(StatusCodes.OK)
        } else {
          return h.response('Not Found').code(StatusCodes.NOT_FOUND).takeover()
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/claims/{reference}',
    options: {
      validate: {
        params: joi.object({
          reference: joi.string().required()
        })
      },
      handler: getClaimHandler
    }
  },
  {
    method: 'GET',
    path: '/api/claim/get-by-application-reference/{ref}',
    options: {
      validate: {
        params: joi.object({
          ref: joi.string()
        }),
        query: joi.object({
          typeOfLivestock: joi
            .string()
            .optional()
            .valid(
              livestockTypes.beef,
              livestockTypes.dairy,
              livestockTypes.pigs,
              livestockTypes.sheep
            )
        })
      },
      handler: async (request, h) => {
        const { typeOfLivestock } = request.query
        const claims = await getByApplicationReference(
          request.params.ref,
          typeOfLivestock
        )

        return h.response(claims).code(StatusCodes.OK)
      }
    }
  },
  {
    method: 'POST',
    path: '/api/claim/search',
    options: {
      validate: {
        payload: joi.object({
          ...searchPayloadSchema,
          sort: joi
            .object({
              field: joi.string().valid().optional().allow(''),
              direction: joi.string().valid().optional().allow(''),
              reference: joi.string().valid().optional().allow('')
            })
            .optional()
        }),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ error: err })
          return h.response({ err }).code(StatusCodes.BAD_REQUEST).takeover()
        }
      },
      handler: async (request, h) => {
        const { search, filter, offset, limit, sort } = request.payload
        const { total, claims } = await searchClaims(
          search,
          filter,
          offset,
          limit,
          sort
        )
        return h.response({ total, claims }).code(StatusCodes.OK)
      }
    }
  },
  {
    method: 'POST',
    path: '/api/claims/is-urn-unique',
    options: {
      validate: {
        payload: joi.object({
          sbi: joi.string().required(),
          laboratoryURN: joi.string().required()
        })
      },
      handler: isURNUniqueHandler
    }
  },
  {
    method: 'POST',
    path: '/api/claims',
    options: {
      handler: createClaimHandler
    }
  },
  {
    method: 'POST',
    path: '/api/claim/get-amount',
    options: {
      validate: {
        payload: joi.object({
          typeOfLivestock: joi
            .string()
            .valid(
              livestockTypes.beef,
              livestockTypes.dairy,
              livestockTypes.pigs,
              livestockTypes.sheep
            )
            .required(),
          reviewTestResults: joi
            .string()
            .valid(testResultsConstant.positive, testResultsConstant.negative)
            .optional(),
          type: joi
            .string()
            .valid(claimType.review, claimType.endemics)
            .required(),
          piHunt: joi.string().valid(piHunt.yes, piHunt.no).optional(),
          piHuntAllAnimals: joi
            .string()
            .valid(piHuntAllAnimals.yes, piHuntAllAnimals.no)
            .optional(),
          dateOfVisit: joi.date().required()
        }),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ error: err })
          return h.response({ err }).code(StatusCodes.BAD_REQUEST).takeover()
        }
      },
      handler: async (request, h) => {
        const amount = await getAmount({
          type: request.payload.type,
          data: request.payload
        })
        return h.response(amount).code(StatusCodes.OK)
      }
    }
  },
  {
    method: 'PUT',
    path: '/api/claim/update-by-reference',
    options: {
      validate: {
        payload: joi.object({
          reference: joi.string().valid().required(),
          status: joi.number().required(),
          user: joi.string().required(),
          note: joi.string()
        }),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ error: err })

          return h.response({ err }).code(StatusCodes.BAD_REQUEST).takeover()
        }
      },
      handler: async (request, h) => {
        const { reference, status, note } = request.payload

        request.logger.setBindings({
          reference,
          status
        })

        const claim = await getClaimByReference(reference)
        if (!claim.dataValues) {
          return h.response('Not Found').code(StatusCodes.NOT_FOUND).takeover()
        }
        const {
          typeOfLivestock,
          reviewTestResults,
          vetVisitsReviewTestResults
        } = claim.dataValues.data || {}
        const applicationReference = claim.dataValues.applicationReference

        const application = await getApplication(applicationReference)
        const { sbi, frn, crn } =
          application?.dataValues?.data?.organisation || {}

        request.logger.setBindings({ sbi })

        await updateClaimByReference(
          {
            reference,
            statusId: status,
            updatedBy: request.payload.user,
            sbi
          },
          note,
          request.logger
        )

        await sendMessage(
          {
            crn,
            sbi,
            agreementReference: applicationReference,
            claimReference: reference,
            claimStatus: status,
            claimType: claim.dataValues.data.claimType,
            typeOfLivestock,
            reviewTestResults: reviewTestResults ?? vetVisitsReviewTestResults,
            piHuntRecommended: claim.dataValues.data.piHuntRecommended,
            piHuntAllAnimals: claim.dataValues.data.piHuntAllAnimals,
            dateTime: new Date(),
            herdName:
              claim.dataValues?.herd?.herdName ||
              getUnnamedHerdValueByTypeOfLivestock(typeOfLivestock)
          },
          messageGeneratorMsgType,
          messageGeneratorQueue,
          { sessionId: uuid() }
        )

        if (status === applicationStatus.readyToPay) {
          let optionalPiHuntValue

          if (
            isVisitDateAfterPIHuntAndDairyGoLive(
              claim.dataValues.data.dateOfVisit
            )
          ) {
            optionalPiHuntValue =
              claim.dataValues.data.piHunt === piHunt.yes &&
              claim.dataValues.data.piHuntAllAnimals === piHuntAllAnimals.yes
                ? 'yesPiHunt'
                : 'noPiHunt'
          }

          await sendMessage(
            {
              reference,
              sbi,
              whichReview: typeOfLivestock,
              isEndemics: true,
              claimType: claim.dataValues.data.claimType,
              reviewTestResults:
                reviewTestResults ?? vetVisitsReviewTestResults,
              frn,
              optionalPiHuntValue
            },
            submitPaymentRequestMsgType,
            submitRequestQueue,
            { sessionId: uuid() }
          )
        }

        return h.response().code(StatusCodes.OK)
      }
    }
  }
]
