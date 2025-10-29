import { StatusCodes } from 'http-status-codes'
import Boom from '@hapi/boom'
import { processClaim, isURNNumberUnique, getClaim } from './claims-service.js'

export const createClaimHandler = async (request, h) => {
  try {
    const { payload, logger, db } = request

    const claim = await processClaim({ payload, logger, db })

    return h.response(claim).code(StatusCodes.OK)
  } catch (err) {
    request.logger.error({ err }, 'Failed to create claim')

    if (Boom.isBoom(err)) {
      throw err
    }

    throw Boom.internal(err)
  }
}

export const isURNUniqueHandler = async (request, h) => {
  try {
    const { sbi, laboratoryURN } = request.payload

    const result = await isURNNumberUnique({
      db: request.db,
      sbi,
      laboratoryURN
    })

    return h.response(result).code(StatusCodes.OK)
  } catch (err) {
    request.logger.error({ err }, 'Failed to check if URN is unique')

    if (Boom.isBoom(err)) {
      throw err
    }

    throw Boom.internal(err)
  }
}

export const getClaimHandler = async (request, h) => {
  try {
    const { reference } = request.params

    const result = await getClaim({
      db: request.db,
      logger: request.logger,
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
