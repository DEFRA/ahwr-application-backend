import joi from 'joi'
import {
  getClaimByReference,
  getByApplicationReference
} from '../../../repositories/claim-repository.js'
import { searchPayloadSchema } from '../schema/search-payload.schema.js'
import { StatusCodes } from 'http-status-codes'
import { TYPE_OF_LIVESTOCK } from 'ffc-ahwr-common-library'
import { searchClaims } from '../../../repositories/claim/claim-search-repository.js'
import {
  createClaimHandler,
  isURNUniqueHandler,
  getClaimHandler,
  updateClaimStatusHandler,
  updateClaimDataHandler
} from './claims-controller.js'

export const claimsHandlers = [
  {
    method: 'GET',
    path: '/api/claims/get-by-reference/{ref}',
    options: {
      description: 'Get a claim by reference', // But wait that is what the handler below is for?
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
      description: 'Get a claim by reference',
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
      description: 'Get all claims for a given app ref, filtered by the livestock', // TODO: confirm if this is used - was not plugged in properly - believe it is replaced by @'/api/applications/{applicationReference}/claims'
      validate: {
        params: joi.object({
          ref: joi.string()
        }),
        query: joi.object({
          typeOfLivestock: joi
            .string()
            .optional()
            .valid(
              TYPE_OF_LIVESTOCK.BEEF,
              TYPE_OF_LIVESTOCK.DAIRY,
              TYPE_OF_LIVESTOCK.PIGS,
              TYPE_OF_LIVESTOCK.SHEEP
            )
        })
      },
      handler: async (request, h) => {
        const { typeOfLivestock } = request.query
        const claims = await getByApplicationReference({
          db: request.db,
          applicationReference: request.params.ref,
          typeOfLivestock
        })

        return h.response(claims).code(StatusCodes.OK)
      }
    }
  },
  {
    method: 'POST',
    path: '/api/claims/search',
    options: {
      description: 'Search for claims based on search criteria',
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
      description: 'Check a claim URN is unique',
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
      description: 'Create a new claim',
      handler: createClaimHandler
    }
  },
  {
    method: 'PUT',
    path: '/api/claims/update-by-reference',
    options: {
      description: 'Update status for a claim',
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
  },
  {
    method: 'PUT',
    path: '/api/claims/{reference}/data',
    options: {
      description: 'Update data items for a claim',
      validate: {
        params: joi.object({
          reference: joi.string()
        }),
        payload: joi
          .object({
            vetsName: joi.string(),
            dateOfVisit: joi.date(),
            vetRCVSNumber: joi.string().pattern(/^\d{6}[\dX]$/i),
            note: joi.string().required(),
            user: joi.string().required()
          })
          .or('vetsName', 'dateOfVisit', 'vetRCVSNumber')
          .required(),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ error: err })
          return h.response({ err }).code(StatusCodes.BAD_REQUEST).takeover()
        }
      }
    },
    handler: updateClaimDataHandler
  }
]
