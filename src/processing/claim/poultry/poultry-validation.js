import joi from 'joi'
import { speciesNumbers } from '../../../constants/index.js'
import { herdSchema } from '../../../routes/api/schema/herd.schema.js'

const getDataModel = () =>
  joi.object({
    amount: joi.string().optional(),
    typeOfLivestock: joi
      .string()
      .valid(
        'chicken',
        'turkey',
        'geese',
        'etc'
      )
      .required(),
    dateOfVisit: joi.date().required(),
    speciesNumbers: joi.string().valid(speciesNumbers.yes, speciesNumbers.no).required(),
    vetsName: joi.string().required(),
    vetRCVSNumber: joi.string().required(),
    ...herdSchema
  })

const getClaimModel = () =>
  joi.object({
    applicationReference: joi.string().required(),
    reference: joi.string().required(),
    createdBy: joi.string().required(),
    data: getDataModel()
  })

export const validatePoultryClaim = (claimData) => {

  return getClaimModel().validate(claimData, {
    abortEarly: false,
    convert: true
  })
}
