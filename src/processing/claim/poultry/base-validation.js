import { claimType, TYPE_OF_POULTRY } from 'ffc-ahwr-common-library'
import joi from 'joi'
import { assuranceScheme, biosecurity, speciesNumbers } from '../../../constants/index.js'
import { herdSchema } from '../../../routes/api/schema/herd.schema.js'

const getDataModel = () =>
  joi.object({
    typeOfLivestock: joi
      .string()
      .valid(
        TYPE_OF_POULTRY.BROILERS,
        TYPE_OF_POULTRY.LAYING,
        TYPE_OF_POULTRY.DUCKS,
        TYPE_OF_POULTRY.GEESE,
        TYPE_OF_POULTRY.TURKEYS
      )
      .required(),
    ...herdSchema,
    dateOfVisit: joi.date().required(),
    speciesNumbers: joi.string().valid(speciesNumbers.yes, speciesNumbers.no).required(),
    vetsName: joi.string().required(),
    vetRCVSNumber: joi.string().required(),
    assuranceScheme: joi.string().valid(assuranceScheme.yes, assuranceScheme.no).required(),
    biosecurity: joi.string().valid(biosecurity.yes, biosecurity.no).required()
  })

const getClaimModel = () =>
  joi.object({
    applicationReference: joi.string().required(),
    reference: joi.string().required(),
    type: joi.string().valid(claimType.review).required(),
    createdBy: joi.string().required(),
    data: getDataModel()
  })

export const validatePoultryClaim = (claimData) => {
  return getClaimModel().validate(claimData, { abortEarly: false, convert: true })
}
