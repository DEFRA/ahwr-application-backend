import { StatusCodes } from 'http-status-codes'
import Boom from '@hapi/boom'
import { processClaim } from './claims-service.js'

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
