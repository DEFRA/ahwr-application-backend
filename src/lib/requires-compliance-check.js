import { config } from '../config/config.js'
import { applicationStatus } from '../constants/index.js'
import { getAndIncrementComplianceCheckCount } from '../repositories/compliance-check-count.js'

export const generateClaimStatus = async (visitDateAsString, logger, db) => {
  if (isFeatureAssuranceEnabledAndStartedBeforeVisitDate(visitDateAsString)) {
    // feature assurance left here as option but specific implementation has been removed
    // if we want to bring it back, then call logic here
    logger.warn('Feature assurance enabled, but no specific implementation provided')
    return getClaimStatusBasedOnRatio(db)
  }

  return getClaimStatusBasedOnRatio(db)
}

const getClaimStatusBasedOnRatio = async (db) => {
  const complianceCheckRatio = Number(config.get('complianceCheckRatio'))

  // if complianceCheckRatio is 0 or less this means compliance checks are turned off
  if (complianceCheckRatio <= 0) {
    return applicationStatus.onHold
  }

  const complianceCheckCount = await getAndIncrementComplianceCheckCount(db)

  // if claim hits the compliance check ratio, it should be inCheck
  if (complianceCheckCount % complianceCheckRatio === 0) {
    return applicationStatus.inCheck
  }

  return applicationStatus.onHold
}

const isFeatureAssuranceEnabledAndStartedBeforeVisitDate = (visitDateAsString) => {
  const { enabled, startDate } = config.get('featureAssurance')
  return enabled && startDate && new Date(visitDateAsString) >= new Date(startDate)
}
