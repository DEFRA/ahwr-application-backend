import joi from 'joi'
import { searchPayloadSchema } from '../schema/search-payload.schema.js'
import { StatusCodes } from 'http-status-codes'
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
