import { claimType, POULTRY_SCHEME } from 'ffc-ahwr-common-library'

const getPoultryPrefix = (typeOfClaim, typeOfLivestock) => {
  if (typeOfClaim !== claimType.review) {
    throw new Error(`Reference cannot be created due to invalid type of reference: ${typeOfClaim}`)
  }

  const typeOfLivestockMap = {
    ducks: 'DK',
    turkeys: 'TK',
    geese: 'GE',
    broilers: 'BR',
    laying: 'LY'
  }

  const lastTwoCharacters = typeOfLivestockMap[typeOfLivestock]

  if (!lastTwoCharacters) {
    throw new Error(
      `Reference cannot be created due to invalid type of livestock: ${typeOfLivestock}`
    )
  }

  return `PO${lastTwoCharacters}`
}

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

export const createClaimReference = (id, typeOfClaim, typeOfLivestock, scheme) => {
  const prefix =
    scheme === POULTRY_SCHEME
      ? getPoultryPrefix(typeOfClaim, typeOfLivestock)
      : getPrefix(typeOfClaim, typeOfLivestock)

  return id.replace('TEMP-CLAIM', prefix)
}

export const createApplicationReference = (id, type) => {
  return id.replace('TEMP', type)
}
