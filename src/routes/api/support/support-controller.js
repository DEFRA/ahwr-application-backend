import Boom from '@hapi/boom'
import { StatusCodes } from 'http-status-codes'
import { getSupportApplication, getSupportClaim, getSupportHerd } from './support-service.js'

export const supportApplicationHandler = async (request, h) => {
  try {
    const { reference } = request.params

    const result = await getSupportApplication({
      db: request.db,
      reference
    })

    return h.response(result).code(StatusCodes.OK)
  } catch (err) {
    request.logger.error({ err }, 'Failed to get application')

    if (Boom.isBoom(err)) {
      throw err
    }

    throw Boom.internal(err)
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
  } catch (err) {
    request.logger.error({ err }, 'Failed to get claim')

    if (Boom.isBoom(err)) {
      throw err
    }

    throw Boom.internal(err)
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
  } catch (err) {
    request.logger.error({ err }, 'Failed to get herd')

    if (Boom.isBoom(err)) {
      throw err
    }

    throw Boom.internal(err)
  }
}
