import { config } from '../config/config.js'
import { updateApplicationRedactRecords } from './update-application-redact-records.js'
import wreck from '@hapi/wreck'

const { sfdMessagingProxyApiUri } = config.get('uris')

export const redactPII = async (agreementsToRedact, redactProgress, logger) => {
  const endpoint = `${sfdMessagingProxyApiUri}/redact/pii`
  const agreementsToRedactPayload = agreementsToRedact.map(({ reference }) => {
    return { reference }
  })
  try {
    await wreck.post(endpoint, {
      json: true,
      payload: { agreementsToRedact: agreementsToRedactPayload }
    })
  } catch (err) {
    logger.setBindings({ err, endpoint })
    await updateApplicationRedactRecords(
      agreementsToRedact,
      true,
      redactProgress,
      'N'
    )
    throw err
  }
}
