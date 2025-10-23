import Joi from 'joi'

export const newHerd = Joi.object({
  id: Joi.string().required(),
  version: Joi.number().required(),
  name: Joi.string().required(),
  cph: Joi.string().required(),
  reasons: Joi.array().required(),
  same: Joi.string().valid('yes', 'no')
})

export const updateHerd = Joi.object({
  id: Joi.string().required(),
  version: Joi.number().required(),
  cph: Joi.string().required(),
  reasons: Joi.array().required()
})

export const herdSchema = {
  herd: Joi.alternatives().try(updateHerd, newHerd).required()
}
