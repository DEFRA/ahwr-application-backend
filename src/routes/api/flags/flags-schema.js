import joi from 'joi'

export const deleteFlagQuerySchema = joi.object({
  flagId: joi.string().valid()
})

export const deleteFlagPayloadSchema = joi.object({
  user: joi.string().required(),
  deletedNote: joi.string().required()
})

export const createFlagQuerySchema = joi.object({
  ref: joi.string().valid()
})

export const createFlagPayloadSchema = joi.object({
  user: joi.string().required(),
  note: joi.string().required(),
  appliesToMh: joi.bool().required()
})
