import { minimumNumberOfAnimalsTested } from '../../../constants/index.js'
import joi from 'joi'
import { claimType, TYPE_OF_LIVESTOCK } from 'ffc-ahwr-common-library'

const minimumAnimalsTestedForReview =
  minimumNumberOfAnimalsTested[TYPE_OF_LIVESTOCK.SHEEP][claimType.review]
const minimumAnimalsTestedForFollowUp =
  minimumNumberOfAnimalsTested[TYPE_OF_LIVESTOCK.SHEEP][claimType.endemics]

const dateOfTesting = { dateOfTesting: joi.date().required() }
const laboratoryURN = { laboratoryURN: joi.string().required() }
const getNumberAnimalsTested = (minNumber) => ({
  numberAnimalsTested: joi.number().min(minNumber).required()
})
const sheepEndemicsPackage = { sheepEndemicsPackage: joi.string().required() }
const testResults = {
  testResults: joi
    .array()
    .items(
      joi.object({
        diseaseType: joi.string(),
        result: joi.alternatives().try(
          joi.string(),
          joi.array().items(
            joi.object({
              diseaseType: joi.string(),
              result: joi.string()
            })
          )
        )
      })
    )
    .required() // note allows an empty array
}

export function getSheepValidation(claimData) {
  if (claimData.type === claimType.review) {
    return {
      ...dateOfTesting,
      ...laboratoryURN,
      ...getNumberAnimalsTested(minimumAnimalsTestedForReview)
    }
  }

  return {
    ...dateOfTesting,
    ...getNumberAnimalsTested(minimumAnimalsTestedForFollowUp),
    ...sheepEndemicsPackage,
    ...testResults
  }
}
