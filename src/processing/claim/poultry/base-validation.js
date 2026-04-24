import { claimType, TYPE_OF_POULTRY } from 'ffc-ahwr-common-library'
import joi from 'joi'
import {
  biosecurity,
  biosecurityUsefulness,
  changesInBiosecurity,
  costOfChanges,
  interview,
  speciesNumbers
} from '../../../constants/index.js'
import { poultrySchema } from '../../../routes/api/schema/herd.schema.js'

const getDataModel = () =>
  joi.object({
    typesOfPoultry: joi
      .array()
      .items(
        joi
          .string()
          .valid(
            TYPE_OF_POULTRY.BROILERS,
            TYPE_OF_POULTRY.LAYING,
            TYPE_OF_POULTRY.BREEDERS,
            TYPE_OF_POULTRY.DUCKS,
            TYPE_OF_POULTRY.GEESE,
            TYPE_OF_POULTRY.TURKEYS
          )
      )
      .required(),
    ...poultrySchema,
    dateOfVisit: joi.date().required(),
    minimumNumberOfBirds: joi.string().valid(speciesNumbers.yes, speciesNumbers.no).required(),
    vetsName: joi.string().required(),
    vetRCVSNumber: joi.string().required(),
    biosecurity: joi
      .string()
      .valid(...Object.values(biosecurity))
      .required(),
    biosecurityUsefulness: joi
      .string()
      .valid(...Object.values(biosecurityUsefulness))
      .required(),
    changesInBiosecurity: joi
      .string()
      .valid(...Object.values(changesInBiosecurity))
      .required(),
    costOfChanges: joi
      .string()
      .valid(...Object.values(costOfChanges))
      .required(),
    interview: joi
      .string()
      .valid(...Object.values(interview))
      .required()
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
