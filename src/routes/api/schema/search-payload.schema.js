import Joi from 'joi'

const SEARCH_MAX_LIMIT = 20

export const searchPayloadSchema = {
  offset: Joi.number().default(0),
  limit: Joi.number().greater(0).default(SEARCH_MAX_LIMIT),
  agreementType: Joi.string().valid('ALL', 'IAHW', 'PBR').optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date()
    .when('dateFrom', {
      is: Joi.date().required(),
      then: Joi.date().min(Joi.ref('dateFrom'))
    })
    .optional(),
  status: Joi.string().valid('AGREED', 'NOT_AGREED').optional(),
  search: Joi.object({
    text: Joi.string().valid().optional().allow(''),
    type: Joi.string().valid().optional().allow('')
  }).optional()
}
