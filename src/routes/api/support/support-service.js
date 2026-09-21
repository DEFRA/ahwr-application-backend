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

const setupSqsClient = (logger) => {
  sqsClient.setupClient(config.get('aws.region'), config.get('aws.endpointUrl'), logger)
}

export const getQueueMessages = async ({ queueUrl, limit, logger }) => {
  setupSqsClient(logger)

  try {
    return await sqsClient.peekMessages(queueUrl, limit)
  } catch (error) {
    if (error instanceof QueueDoesNotExist) {
      throw Boom.notFound(`Queue not found: ${queueUrl}`)
    }
    throw error
  }
}

export const checkIsDeadLetterQueue = async ({ queueUrl, logger }) => {
  setupSqsClient(logger)

  try {
    return await sqsClient.isDeadLetterQueue(queueUrl)
  } catch (error) {
    if (error instanceof QueueDoesNotExist) {
      throw Boom.notFound(`Queue not found: ${queueUrl}`)
    }
    throw error
  }
}

export const applyQueueMessageActions = async ({ queueUrl, actionsById, logger }) => {
  setupSqsClient(logger)

  try {
    if (!(await sqsClient.isDeadLetterQueue(queueUrl))) {
      throw Boom.badRequest(`Not a dead-letter queue: ${queueUrl}`)
    }

    return await sqsClient.applyDlqActions(queueUrl, actionsById)
  } catch (error) {
    if (error instanceof QueueDoesNotExist) {
      throw Boom.notFound(`Queue not found: ${queueUrl}`)
    }
    throw error
  }
}
