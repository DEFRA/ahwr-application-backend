import { getHolidayCalendarForEngland } from '../external-api/holidays.js'

const parseDate = (date) => {
  const [day, month, year] = date.split('/')
  return new Date(year, month - 1, day)
}

export const startAndEndDate = (date) => {
  const startDate = parseDate(date)
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 1)
  return { startDate, endDate }
}

export const isAtLeastMonthsOld = (dateToCheck, months) => {
  const now = new Date()
  const comparisonDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, now.getUTCDate())
  )

  return dateToCheck <= comparisonDate
}

export const isTodayHoliday = async () => {
  const holidays = await getHolidayCalendarForEngland()
  const today = new Date().toISOString().split('T')[0] // Format today's date as YYYY-MM-DD
  const isHoliday = holidays?.some((holiday) => holiday.date === today)

  return Boolean(isHoliday)
}
