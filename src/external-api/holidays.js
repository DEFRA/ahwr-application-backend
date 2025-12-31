import wreck from '@hapi/wreck'
import { getLogger } from '../logging/logger.js'

export const getHolidayCalendarForEngland = async () => {
  const endpoint = 'https://www.gov.uk/bank-holidays.json'

  try {
    const { payload } = await wreck.get(endpoint, { json: true })

    if (!payload?.['england-and-wales']?.events) {
      throw new Error('bank holidays response missing events')
    }

    return payload['england-and-wales'].events // Returns only the events for England and Wales
  } catch (err) {
    getLogger().error({ err })
    throw err
  }
}
