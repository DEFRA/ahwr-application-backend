import {
  MULTIPLE_HERDS_RELEASE_DATE,
  PIGS_AND_PAYMENTS_RELEASE_DATE,
  piHunt,
  piHuntAllAnimals
} from '../constants/index.js'
import {
  PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE,
  TYPE_OF_LIVESTOCK,
  UNNAMED_FLOCK,
  UNNAMED_HERD
} from 'ffc-ahwr-common-library'

export const isVisitDateAfterPIHuntAndDairyGoLive = (dateOfVisit) => {
  const dateOfVisitParsed = new Date(dateOfVisit)
  if (Number.isNaN(dateOfVisitParsed.getTime())) {
    throw new Error(`dateOfVisit must be parsable as a date, value provided: ${dateOfVisit}`)
  }

  return dateOfVisitParsed >= PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE
}

export const isMultipleHerdsUserJourney = (dateOfVisit, agreementFlags) => {
  if (new Date(dateOfVisit) < MULTIPLE_HERDS_RELEASE_DATE) {
    return false
  }
  // check for rejected T&Cs flag, if absent then is multiple herds journey
  return !agreementFlags?.some((f) => f.appliesToMh)
}

export const isOWAppRef = (applicationReference) => applicationReference.startsWith('AHWR')

export const isPigsAndPaymentsUserJourney = (dateOfVisit) => {
  return new Date(dateOfVisit) >= PIGS_AND_PAYMENTS_RELEASE_DATE
}

export const checkForPiHunt = (claim) => {
  return claim.data.piHunt === piHunt.yes && claim.data.piHuntAllAnimals === piHuntAllAnimals.yes
    ? 'yesPiHunt'
    : 'noPiHunt'
}

export const getUnnamedHerdValueByTypeOfLivestock = (typeOfLivestock) =>
  typeOfLivestock === TYPE_OF_LIVESTOCK.SHEEP ? UNNAMED_FLOCK : UNNAMED_HERD

export const getHerdName = (claim) => {
  return claim.herd?.name ?? getUnnamedHerdValueByTypeOfLivestock(claim.data.typeOfLivestock)
}

export const getReviewTestResults = (claim) => {
  return claim.data.reviewTestResults ?? claim.data.vetVisitsReviewTestResults
}
