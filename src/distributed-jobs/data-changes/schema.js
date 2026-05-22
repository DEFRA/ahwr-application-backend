import Joi from 'joi'

/** @type {readonly {DELETION: 'deletion', FIELD_CHANGE: 'fieldChange'}} */
export const TYPE_OF_CHANGE = {
  DELETION: 'deletion',
  FIELD_CHANGE: 'fieldChange'
}

export const changeSchema = Joi.object({
  claimRef: Joi.string().required(),
  sbi: Joi.string().required(),
  applicationRef: Joi.string().required(),
  action: Joi.string().valid(TYPE_OF_CHANGE.DELETION, TYPE_OF_CHANGE.FIELD_CHANGE).required(),
  field: Joi.string().when('action', { is: TYPE_OF_CHANGE.FIELD_CHANGE, then: Joi.required() }),
  note: Joi.string().when('action', { is: TYPE_OF_CHANGE.FIELD_CHANGE, then: Joi.required() }),
  newValue: Joi.alternatives()
    .try(Joi.string(), Joi.array())
    .when('action', { is: TYPE_OF_CHANGE.FIELD_CHANGE, then: Joi.required() }),
  oldValue: Joi.alternatives()
    .try(Joi.string(), Joi.array())
    .when('action', { is: TYPE_OF_CHANGE.FIELD_CHANGE, then: Joi.required() }),
  skipDataChange: Joi.boolean(),
  skipSendEvent: Joi.boolean()
})
