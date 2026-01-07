import { claimType, TYPE_OF_LIVESTOCK } from 'ffc-ahwr-common-library'

export const MULTIPLE_HERDS_RELEASE_DATE = new Date('2025-06-26T00:00:00')
export const PIGS_AND_PAYMENTS_RELEASE_DATE = new Date('2026-01-22T00:00:00')

export const testResults = {
  positive: 'positive',
  negative: 'negative'
}

export const speciesNumbers = {
  yes: 'yes',
  no: 'no'
}

export const biosecurity = {
  yes: 'yes',
  no: 'no'
}

export const piHunt = {
  yes: 'yes',
  no: 'no'
}

export const piHuntRecommended = {
  yes: 'yes',
  no: 'no'
}

export const piHuntAllAnimals = {
  yes: 'yes',
  no: 'no'
}

export const minimumNumberOfOralFluidSamples = 5

export const minimumNumberOfAnimalsTested = {
  [TYPE_OF_LIVESTOCK.BEEF]: {
    [claimType.review]: 5,
    [claimType.endemics]: 11
  },
  [TYPE_OF_LIVESTOCK.DAIRY]: {
    [claimType.review]: 5,
    [claimType.endemics]: 1
  },
  [TYPE_OF_LIVESTOCK.PIGS]: {
    [claimType.review]: 30,
    [claimType.endemics]: 30
  },
  [TYPE_OF_LIVESTOCK.SHEEP]: {
    [claimType.review]: 1,
    [claimType.endemics]: 1
  }
}

export const APPLICATION_COLLECTION = 'applications'
export const OW_APPLICATION_COLLECTION = 'owapplications'
export const CLAIMS_COLLECTION = 'claims'
export const HERDS_COLLECTION = 'herds'
