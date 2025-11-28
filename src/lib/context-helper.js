import { PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE } from '../constants/index.js'
import { config } from '../config/config.js'

export const isVisitDateAfterPIHuntAndDairyGoLive = (dateOfVisit) => {
  const dateOfVisitParsed = new Date(dateOfVisit)
  if (Number.isNaN(dateOfVisitParsed.getTime())) {
    throw new Error(`dateOfVisit must be parsable as a date, value provided: ${dateOfVisit}`)
  }

  return dateOfVisitParsed >= PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE
}

export const isMultipleHerdsUserJourney = (dateOfVisit, agreementFlags) => {
  if (new Date(dateOfVisit) < new Date(config.get('multiHerds.releaseDate'))) {
    return false
  }
  // check for rejected T&Cs flag, if absent then is multiple herds journey
  return !agreementFlags?.some((f) => f.appliesToMh)
}

export const isOWAppRef = (applicationReference) => applicationReference.startsWith('AHWR')
