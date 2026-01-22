import Boom from '@hapi/boom'
import { getApplicationWithFullFlags } from '../../../repositories/application-repository.js'
import { getClaimByReference } from '../../../repositories/claim-repository.js'
import { getHerdById } from '../../../repositories/herd-repository.js'

export const getSupportApplication = async ({ db, reference }) => {
  const application = await getApplicationWithFullFlags({ db, reference })

  if (!application) {
    throw Boom.notFound('Application not found')
  }

  return application
}

export const getSupportClaim = async ({ db, reference }) => {
  const claim = await getClaimByReference(db, reference)

  if (!claim) {
    throw Boom.notFound('Claim not found')
  }

  return claim
}

export const getSupportHerd = async ({ db, id }) => {
  const claim = await getHerdById(db, id)

  if (!claim) {
    throw Boom.notFound('Herd not found')
  }

  return claim
}
