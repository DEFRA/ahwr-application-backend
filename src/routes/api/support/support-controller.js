import Boom from '@hapi/boom'
import { StatusCodes } from 'http-status-codes'
import {
  getQueueMessages,
  getSupportApplication,
  getSupportClaim,
  getSupportHerd
} from './support-service.js'

export const supportApplicationHandler = async (request, h) => {
  try {
    const { reference } = request.params

    const result = await getSupportApplication({
      db: request.db,
      reference
    })

    return h.response(result).code(StatusCodes.OK)
  } catch (error) {
    request.logger.error({ error }, 'Failed to get application')

    if (Boom.isBoom(error)) {
      throw error
    }

    throw Boom.internal(error)
  }
}

export const supportClaimHandler = async (request, h) => {
  try {
    const { reference } = request.params

    const result = await getSupportClaim({
      db: request.db,
      reference
    })

    return h.response(result).code(StatusCodes.OK)
  } catch (error) {
    request.logger.error({ error }, 'Failed to get claim')

    if (Boom.isBoom(error)) {
      throw error
    }

    throw Boom.internal(error)
  }
}

export const supportHerdHandler = async (request, h) => {
  try {
    const { id } = request.params

    const result = await getSupportHerd({
      db: request.db,
      id
    })

    return h.response(result).code(StatusCodes.OK)
  } catch (error) {
    request.logger.error({ error }, 'Failed to get herd')

    if (Boom.isBoom(error)) {
      throw error
    }

    throw Boom.internal(error)
  }
}

export const supportQueueMessagesHandler = async (request, h) => {
  try {
    const { queueUrl, limit } = request.query

    const result = await getQueueMessages({
      queueUrl,
      limit,
      logger: request.logger
    })

    return h.response(result).code(StatusCodes.OK)
  } catch (error) {
    request.logger.error({ error }, 'Failed to get queue messages')

    if (Boom.isBoom(error)) {
      throw error
    }

    throw Boom.internal(error)
  }
}
