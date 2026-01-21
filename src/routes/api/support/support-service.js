import Boom from '@hapi/boom'
import { getApplicationWithFullFlags } from '../../../repositories/application-repository'
import { getClaimByReference } from '../../../repositories/claim-repository'
import { getHerdById } from '../../../repositories/herd-repository'

export const getSupportApplication = async ({ db, logger, reference }) => {
  const application = await getApplicationWithFullFlags({ db, reference })

  if (!application) {
    throw Boom.notFound('Application not found')
  }

  return application
}

export const getSupportClaim = async ({ db, logger, reference }) => {
  const claim = await getClaimByReference(db, reference)

  if (!claim) {
    throw Boom.notFound('Claim not found')
  }

  return claim
}

export const getSupportHerd = async ({ db, logger, reference }) => {
  const claim = await getHerdById(db, reference)

  if (!claim) {
    throw Boom.notFound('Herd not found')
  }

  return claim
}
