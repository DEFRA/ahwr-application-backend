import { cleanupBySbi } from './cleanup-service.js'
import { StatusCodes } from 'http-status-codes'

export const cleanupController = async (request, h) => {
  const { sbi } = request.query

  await cleanupBySbi(sbi, request.db, request.logger)

  return h.response().code(StatusCodes.NO_CONTENT)
}
