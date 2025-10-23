import joi from 'joi'
import { claimType, TYPE_OF_LIVESTOCK } from 'ffc-ahwr-common-library'
import { speciesNumbers } from '../../../constants/index.js'
import { isMultipleHerdsUserJourney } from '../../../lib/context-helper.js'
import { herdSchema } from '../../../routes/api/schema/herd.schema.js'
import { getBeefValidation } from './beef-validation.js'
import { getDairyValidation } from './dairy-validation.js'
import { getPigsValidation } from './pigs-validation.js'
import { getSheepValidation } from './sheep-validation.js'

const getDataModel = (multiHerds, specificValidationsForClaimType) =>
  joi.object({
    amount: joi.string().optional(),
    typeOfLivestock: joi
      .string()
      .valid(
        TYPE_OF_LIVESTOCK.BEEF,
        TYPE_OF_LIVESTOCK.DAIRY,
        TYPE_OF_LIVESTOCK.PIGS,
        TYPE_OF_LIVESTOCK.SHEEP
      )
      .required(),
    dateOfVisit: joi.date().required(),
    speciesNumbers: joi
      .string()
      .valid(speciesNumbers.yes, speciesNumbers.no)
      .required(),
    vetsName: joi.string().required(),
    vetRCVSNumber: joi.string().required(),
    ...specificValidationsForClaimType,
    ...(multiHerds && herdSchema)
  })

const getClaimModel = (multiHerds, specificValidationsForClaimType) =>
  joi.object({
    applicationReference: joi.string().required(),
    reference: joi.string().required(),
    type: joi.string().valid(claimType.review, claimType.endemics).required(),
    createdBy: joi.string().required(),
    data: getDataModel(multiHerds, specificValidationsForClaimType)
  })

export const validateAhwrClaim = (claimData, applicationFlags) => {
  const multiHerds = isMultipleHerdsUserJourney(
    claimData.data.dateOfVisit,
    applicationFlags
  )

  const specificValidationsForClaimType = speciesSpecificValidations.get(
    claimData.data.typeOfLivestock
  )(claimData)

  return getClaimModel(multiHerds, specificValidationsForClaimType).validate(
    claimData,
    { abortEarly: false }
  )
}

const speciesSpecificValidations = new Map([
  [TYPE_OF_LIVESTOCK.BEEF, getBeefValidation],
  [TYPE_OF_LIVESTOCK.DAIRY, getDairyValidation],
  [TYPE_OF_LIVESTOCK.PIGS, getPigsValidation],
  [TYPE_OF_LIVESTOCK.SHEEP, getSheepValidation]
])
