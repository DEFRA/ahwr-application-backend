import { redactClaimPII } from '../repositories/claim-repository.js'
import { redactContactHistoryPII } from '../repositories/contact-history-repository.js'
import { redactFlagPII } from '../repositories/flag-repository.js'
import { redactHerdPII } from '../repositories/herd-repository.js'
import { redactApplicationPII } from '../repositories/application-repository.js'
import { updateApplicationRedactRecords } from './update-application-redact-records.js'
import pLimit from 'p-limit'

const CONCURRENCY = 20

export const redactApplicationDatabasePII = async (agreementsToRedact, redactProgress, logger) => {
  try {
    const limit = pLimit(CONCURRENCY)

    await Promise.all(
      agreementsToRedact.map((agreement) =>
        limit(async () => {
          await redactHerdPII(agreement.reference)
          await redactFlagPII(agreement.reference)
          await redactContactHistoryPII(agreement.reference, logger)
          await redactClaimPII(agreement.reference, logger)
          await redactApplicationPII(agreement.reference, logger)
        })
      )
    )
    logger.info(`applicationDatabaseRedactPII with: ${JSON.stringify(agreementsToRedact)}`)
  } catch (err) {
    logger.setBindings({ error: err })
    await updateApplicationRedactRecords(agreementsToRedact, true, redactProgress, 'N')
    throw err
  }
}
