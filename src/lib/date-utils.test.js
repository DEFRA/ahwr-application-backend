import { startAndEndDate, isAtLeastMonthsOld, isTodayHoliday } from './date-utils.js'
import { getHolidayCalendarForEngland } from '../external-api/holidays.js'

jest.mock('../external-api/holidays.js')

describe('date utils', () => {
  describe('startandEndDate', () => {
    it('should return an object with start and end date', () => {
      const date = '01/01/2022'
      const result = startAndEndDate(date)
      const expectedStartDate = new Date(2022, 0, 1)
      const expectedEndDate = new Date(2022, 0, 2)

      expect(result.startDate).toEqual(expectedStartDate)
      expect(result.endDate).toEqual(expectedEndDate)
    })
  })

  describe('isAtLeastMonthsOld', () => {
    const mockToday = new Date('2025-11-07T00:00:00Z')

    beforeAll(() => {
      jest.useFakeTimers()
      jest.setSystemTime(mockToday)
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    test('returns true when date is older than specified months', () => {
      const oldDate = new Date('2025-02-01')
      expect(isAtLeastMonthsOld(oldDate, 6)).toBe(true)
    })

    test('returns false when date is newer than specified months', () => {
      const recentDate = new Date('2025-09-01')
      expect(isAtLeastMonthsOld(recentDate, 3)).toBe(false)
    })

    test('returns true when date is exactly N mont  hs old', () => {
      const exactDate = new Date('2025-05-07')
      expect(isAtLeastMonthsOld(exactDate, 6)).toBe(true)
    })

    test('returns false when date is in the future', () => {
      const futureDate = new Date('2026-01-01')
      expect(isAtLeastMonthsOld(futureDate, 1)).toBe(false)
    })
  })

  describe('isTodayHoliday', () => {
    const xmasEve = new Date('2025-12-24T12:00:00Z')

    beforeAll(() => {
      jest.useFakeTimers('modern')
      jest.setSystemTime(xmasEve)
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

    it('returns true if today is a holiday', async () => {
      getHolidayCalendarForEngland.mockResolvedValue([
        { title: 'Christmas Eve (newly a bank holiday!)', date: '2025-12-24' }
      ])

      const result = await isTodayHoliday()
      expect(result).toBe(true)
    })

    it('returns false if today is not a holiday', async () => {
      getHolidayCalendarForEngland.mockResolvedValue([
        { title: 'Christmas', date: '2025-12-25' },
        { title: 'Boxing Day', date: '2025-12-26' }
      ])

      const result = await isTodayHoliday()
      expect(result).toBe(false)
    })
  })
})
