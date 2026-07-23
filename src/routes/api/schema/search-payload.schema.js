import Joi from 'joi'
import { STATUS } from 'ffc-ahwr-common-library'

const SEARCH_MAX_LIMIT = 20

const commonSearchFields = {
  offset: Joi.number().default(0),
  limit: Joi.number().greater(0).default(SEARCH_MAX_LIMIT),
  agreementType: Joi.string().valid('ALL', 'IAHW', 'PBR').optional(),
  flag: Joi.string().valid('ALL', 'FLAGGED', 'NOT_FLAGGED').optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date()
    .when('dateFrom', {
      is: Joi.date().required(),
      then: Joi.date().min(Joi.ref('dateFrom'))
    })
    .optional(),
  search: Joi.object({
    text: Joi.string().valid().optional().allow(''),
    type: Joi.string().valid().optional().allow('')
  }).optional()
}

export const applicationSearchPayloadSchema = {
  ...commonSearchFields,
  status: Joi.string().valid('AGREED', 'NOT_AGREED').optional(),
  sort: Joi.object({
    field: Joi.string().valid().optional().default('CREATEDAT'),
    direction: Joi.string().valid().optional().allow('ASC')
  }).optional()
}

export const claimSearchPayloadSchema = {
  ...commonSearchFields,
  status: Joi.string()
    .valid(...Object.values(STATUS))
    .optional(),
  species: Joi.string().valid('beef', 'dairy', 'sheep', 'pigs', 'poultry').optional(),
  claimType: Joi.string().valid('ALL', 'REVIEW', 'FOLLOW_UP').optional(),
  sort: Joi.object({
    field: Joi.string().valid().optional().allow(''),
    direction: Joi.string().valid().optional().allow(''),
    reference: Joi.string().valid().optional().allow('')
  }).optional()
}
