import { claimType } from 'ffc-ahwr-common-library'

const getPrefix = (typeOfClaim, typeOfLivestock) => {
  const claimTypeMap = {
    [claimType.review]: 'RE',
    [claimType.endemics]: 'FU',
    ['poultry']: 'PO'
  }

  const firstTwoCharacters = claimTypeMap[typeOfClaim]

  if (!firstTwoCharacters) {
    throw new Error(`Reference cannot be created due to invalid type of reference: ${typeOfClaim}`)
  }

  const typeOfLivestockMap = {
    beef: 'BC',
    dairy: 'DC',
    pigs: 'PI',
    sheep: 'SH',
    chicken: 'CH',
    turkey: 'TU',
    ducks: 'DU'
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

export const createApplicationReference = (id) => {
  return id.replace('TEMP', 'IAHW')
}
