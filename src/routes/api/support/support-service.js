import Boom from '@hapi/boom'
import { getApplicationWithFullFlags } from '../../../repositories/application-repository.js'
import { getClaimByReference } from '../../../repositories/claim-repository.js'
import { getAllHerdVersionsById } from '../../../repositories/herd-repository.js'
import { config } from '../../../config/config.js'
import { sqsClient } from 'ffc-ahwr-common-library'
import { QueueDoesNotExist } from '@aws-sdk/client-sqs'

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
  const claim = await getAllHerdVersionsById(db, id)

  if (!claim) {
    throw Boom.notFound('Herd not found')
  }

  return claim
}

export const getQueueMessages = async ({ queueUrl, limit, logger }) => {
  const region = config.get('aws.region')
  const endpointUrl = config.get('aws.endpointUrl')

  sqsClient.setupClient(region, endpointUrl, logger)

  try {
    return await sqsClient.peekMessages(queueUrl, limit)
  } catch (error) {
    if (error instanceof QueueDoesNotExist) {
      throw Boom.notFound(`Queue not found: ${queueUrl}`)
    }
    throw error
  }
}
