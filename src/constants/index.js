import { config } from '../config/config.js'
import { claimType } from 'ffc-ahwr-common-library'

export const PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE = new Date(
  '2025-01-21T00:00:00'
)

export const MULTIPLE_HERDS_RELEASE_DATE = new Date(
  config.get('multiHerds.releaseDate')
)

export const applicationStatus = {
  agreed: 'AGREED',
  inCheck: 'IN_CHECK',
  notAgreed: 'NOT_AGREED',
  readyToPay: 'READY_TO_PAY',
  rejected: 'REJECTED',
  withdrawn: 'WITHDRAWN',
  onHold: 'ON_HOLD',
  paid: 'PAID',
  recommendedToPay: 'RECOMMENDED_TO_PAY',
  recommendedToReject: 'RECOMMENDED_TO_REJECT'
}

export const livestockTypes = {
  beef: 'beef',
  dairy: 'dairy',
  pigs: 'pigs',
  sheep: 'sheep'
}

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
  [livestockTypes.beef]: {
    [claimType.review]: 5,
    [claimType.endemics]: 11
  },
  [livestockTypes.dairy]: {
    [claimType.review]: 5,
    [claimType.endemics]: 1
  },
  [livestockTypes.pigs]: {
    [claimType.review]: 30,
    [claimType.endemics]: 30
  },
  [livestockTypes.sheep]: {
    [claimType.review]: 1,
    [claimType.endemics]: 1
  }
}

export const APPLICATION_COLLECTION = 'applications'
export const OW_APPLICATION_COLLECTION = 'owapplications'
export const CLAIMS_COLLECTION = 'claims'
export const HERDS_COLLECTION = 'herds'

export const messagingStates = {
  alreadyClaimed: 'already_claimed',
  alreadySubmitted: 'already_submitted',
  alreadyExists: 'already_exists',
  error: 'error',
  failed: 'failed',
  notFound: 'not_found',
  notSubmitted: 'not_submitted',
  submitted: 'submitted',
  success: 'success'
}
