import { updateApplicationRedact } from '../repositories/application-redact-repository.js'
import pLimit from 'p-limit'

const CONCURRENCY = 20

export const updateApplicationRedactRecords = async (
  applicationsToRedact,
  incrementRetryCount,
  status,
  success
) => {
  const limit = pLimit(CONCURRENCY)

  // TODO 1182 impl
  // await sequelize.transaction(async (t) => {
  //   await Promise.all(
  applicationsToRedact.map((a) =>
    limit(() => {
      const retryCount = incrementRetryCount ? Number(a.retryCount) + 1 : a.retryCount
      return updateApplicationRedact(
        a.id,
        retryCount,
        status.join(),
        success
        // ,{ transaction: t }
      )
    })
  )
  //   )
  // })
}
