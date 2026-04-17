import { CLAIM_REFERENCE_PREFIX_POULTRY, claimType } from 'ffc-ahwr-common-library'

const getPrefix = (typeOfClaim, typeOfLivestock) => {
  const claimTypeMap = {
    [claimType.review]: 'RE',
    [claimType.endemics]: 'FU'
  }

  const firstTwoCharacters = claimTypeMap[typeOfClaim]

  if (!firstTwoCharacters) {
    throw new Error(`Reference cannot be created due to invalid type of reference: ${typeOfClaim}`)
  }

  const typeOfLivestockMap = {
    beef: 'BC',
    dairy: 'DC',
    pigs: 'PI',
    sheep: 'SH'
  }

  const lastTwoCharacters = typeOfLivestockMap[typeOfLivestock]

  if (!lastTwoCharacters) {
    throw new Error(
      `Reference cannot be created due to invalid type of livestock: ${typeOfLivestock}`
    )
  }

  return `${firstTwoCharacters}${lastTwoCharacters}`
}

export const createClaimReference = (id, typeOfClaim, typeOfLivestock) => {
  const prefix = getPrefix(typeOfClaim, typeOfLivestock)

  return id.replace('TEMP-CLAIM', prefix)
}

export const createPoultryClaimReference = (id) => {
  return id.replace('TEMP-CLAIM', CLAIM_REFERENCE_PREFIX_POULTRY)
}

export const createApplicationReference = (id, type) => {
  return id.replace('TEMP', type)
}
