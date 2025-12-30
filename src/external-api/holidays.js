import wreck from '@hapi/wreck'

export const getHolidayCalendarForEngland = async (logger) => {
  const endpoint = 'https://www.gov.uk/bank-holidays.json'
  try {
    const { payload } = await wreck.get(endpoint, { json: true })

    if (!payload?.['england-and-wales']?.events) {
      throw new Error('bank holidays response missing events')
    }

    return payload['england-and-wales'].events // Returns only the events for England and Wales
  } catch (err) {
    logger.error({ err })
    throw err
  }
}
