import Joi from 'joi'

/** @type {readonly {DELETION: 'deletion', FIELD_CHANGE: 'fieldChange', FIELD_DELETION: 'fieldDeletion'}} */
export const TYPE_OF_CHANGE = {
  DELETION: 'deletion',
  FIELD_CHANGE: 'fieldChange',
  FIELD_DELETION: 'fieldDeletion'
}

/**
 * The document a change applies to. Defaults to CLAIM - the vast majority of changes
 * update a single claim (or, when field is one of HERD_PROPERTY_BY_FIELD, the herd it's
 * currently associated with). Claim and application fields can share the same name
 * (e.g. status, createdAt, reference), so which document gets updated is decided by this
 * explicit target rather than inferred from the field name.
 */
export const CHANGE_TARGET = {
  CLAIM: 'claim',
  APPLICATION: 'application'
}

/**
 * Fields that are versioned on the herd rather than stored on the claim data.
 * Maps the field name used in a change to the property name stored on the herd.
 */
export const HERD_PROPERTY_BY_FIELD = {
  herdReasons: 'reasons',
  herdCph: 'cph',
  herdName: 'name'
}

/**
 * Fields that can be updated on the application document (target: CHANGE_TARGET.APPLICATION).
 * field is used as the actual property name stored on the application - this maps it to the
 * type it must be coerced to before being persisted, since incoming changes only ever carry
 * strings/arrays (see newValue/oldValue below) but some application fields (e.g. createdAt,
 * which doubles as the agreement date, set when the application reaches AGREED status) are
 * real Dates elsewhere and are sorted/range-filtered as such.
 */
export const APPLICATION_FIELD_TYPES = {
  createdAt: 'date'
}

/** Actions that target a single named field */
const FIELD_ACTIONS = Joi.valid(TYPE_OF_CHANGE.FIELD_CHANGE, TYPE_OF_CHANGE.FIELD_DELETION)

const IS_APPLICATION_TARGET = Joi.valid(CHANGE_TARGET.APPLICATION)

export const changeSchema = Joi.object({
  // Application-level changes act on the whole application rather than a single claim,
  // so they don't carry a claimRef.
  claimRef: Joi.string().when('target', {
    is: IS_APPLICATION_TARGET,
    then: Joi.optional(),
    otherwise: Joi.required()
  }),
  sbi: Joi.string().required(),
  applicationRef: Joi.string().required(),
  target: Joi.string()
    .valid(CHANGE_TARGET.CLAIM, CHANGE_TARGET.APPLICATION)
    .default(CHANGE_TARGET.CLAIM),
  action: Joi.string()
    .valid(TYPE_OF_CHANGE.DELETION, TYPE_OF_CHANGE.FIELD_CHANGE, TYPE_OF_CHANGE.FIELD_DELETION)
    .required(),
  field: Joi.string()
    .when('action', { is: FIELD_ACTIONS, then: Joi.required() })
    .when('target', {
      is: IS_APPLICATION_TARGET,
      then: Joi.valid(...Object.keys(APPLICATION_FIELD_TYPES))
    }),
  dateRequested: Joi.date().iso().required(),
  requester: Joi.string().required(),
  newValue: Joi.alternatives()
    .try(Joi.string(), Joi.array())
    .when('action', { is: TYPE_OF_CHANGE.FIELD_CHANGE, then: Joi.required() }),
  oldValue: Joi.alternatives()
    .try(Joi.string(), Joi.array())
    .when('action', { is: FIELD_ACTIONS, then: Joi.required() }),
  skipDataChange: Joi.boolean(),
  skipSendEvent: Joi.boolean()
})
