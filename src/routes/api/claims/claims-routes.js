import joi from 'joi'
import {
  piHunt,
  piHuntAllAnimals,
  testResults as testResultsConstant,
  livestockTypes
} from '../../../constants/index.js'
import {
  getClaimByReference,
  getByApplicationReference
} from '../../../repositories/claim-repository.js'
import { searchPayloadSchema } from '../schema/search-payload.schema.js'
import { StatusCodes } from 'http-status-codes'
import { claimType, getAmount } from 'ffc-ahwr-common-library'
import { searchClaims } from '../../../repositories/claim/claim-search-repository.js'
import {
  createClaimHandler,
  isURNUniqueHandler,
  getClaimHandler,
  updateClaimStatusHandler
} from './claims-controller.js'

export const claimHandlers = [
  {
    method: 'GET',
    path: '/api/claims/get-by-reference/{ref}',
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
    path: '/api/claims/get-by-application-reference/{ref}',
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
        const claims = await getByApplicationReference(request.params.ref, typeOfLivestock)

        return h.response(claims).code(StatusCodes.OK)
      }
    }
  },
  {
    method: 'POST',
    path: '/api/claims/search',
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
          request.db,
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
    path: '/api/claims/get-amount',
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
          type: joi.string().valid(claimType.review, claimType.endemics).required(),
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
        const amount = await getAmount(request.payload)
        return h.response(amount).code(StatusCodes.OK)
      }
    }
  },
  {
    method: 'PUT',
    path: '/api/claims/update-by-reference',
    options: {
      validate: {
        payload: joi.object({
          reference: joi.string().valid().required(),
          status: joi.string().required(),
          user: joi.string().required(),
          note: joi.string()
        }),
        failAction: async (request, h, err) => {
          request.logger.error({ err })

          return h.response({ err }).code(StatusCodes.BAD_REQUEST).takeover()
        }
      },
      handler: updateClaimStatusHandler
    }
  }
]
