import Joi from 'joi'
import { sbiSchema } from '../schema/sbi.schema.js'

const ERROR_MESSAGE = {
  mandatoryQueryParameters: '"sbi" query param must be provided',
  enterSbiNumberThatHas9Digits: 'The SBI number must have 9 digits',
  sbiNumberOutOfRange:
    'The single business identifier (SBI) number is not recognised'
}

const organisationValidations = () => ({
  farmerName: Joi.string().required(),
  name: Joi.string().required(),
  sbi: Joi.string().required(),
  cph: Joi.string().optional(),
  crn: Joi.string().optional(),
  frn: Joi.string().optional(),
  address: Joi.string().required(),
  email: Joi.string().required().lowercase().email({ tlds: false }),
  orgEmail: Joi.string()
    .allow(null)
    .optional()
    .lowercase()
    .email({ tlds: false })
})

export const applicationSchema = Joi.object({
  confirmCheckDetails: Joi.string().required(),
  reference: Joi.string().allow(null).required(),
  declaration: Joi.boolean().required(),
  offerStatus: Joi.string().required(),
  organisation: Joi.object({
    ...organisationValidations(),
    userType: Joi.string().valid('newUser', 'existingUser').required()
  }),
  contactHistory: Joi.array().items(
    Joi.object({
      createdBy: Joi.string(),
      createdOn: Joi.string(),
      field: Joi.string(),
      oldValue: Joi.string(),
      newValue: Joi.string()
    })
      .allow(null)
      .optional()
  )
})

export const getApplicationsQuerySchema = Joi.object({
  sbi: sbiSchema
})
  .min(1)
  .messages({
    'object.min': ERROR_MESSAGE.mandatoryQueryParameters,
    'number.base': ERROR_MESSAGE.enterSbiNumberThatHas9Digits,
    'number.integer': ERROR_MESSAGE.enterSbiNumberThatHas9Digits,
    'number.less': ERROR_MESSAGE.enterSbiNumberThatHas9Digits,
    'number.greater': ERROR_MESSAGE.enterSbiNumberThatHas9Digits,
    'number.min': ERROR_MESSAGE.sbiNumberOutOfRange,
    'number.max': ERROR_MESSAGE.sbiNumberOutOfRange
  })
