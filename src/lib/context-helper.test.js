import {
  PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE,
  TYPE_OF_LIVESTOCK
} from 'ffc-ahwr-common-library'
import {
  isVisitDateAfterPIHuntAndDairyGoLive,
  isMultipleHerdsUserJourney,
  isPigsAndPaymentsUserJourney,
  getHerdName,
  getUnnamedHerdValueByTypeOfLivestock
} from './context-helper.js'

describe('context-helper', () => {
  test('isVisitDateAfterGoLive throws error when no visit date provided', () => {
    expect(() => {
      isVisitDateAfterPIHuntAndDairyGoLive(undefined)
    }).toThrow('dateOfVisit must be parsable as a date, value provided: undefined')
  })
  test('isVisitDateAfterGoLive throws error when visit date provided is not parsable as a date', () => {
    expect(() => {
      isVisitDateAfterPIHuntAndDairyGoLive('abc123')
    }).toThrow('dateOfVisit must be parsable as a date, value provided: abc123')
  })
  test('isVisitDateAfterGoLive returns true when visit date is same', () => {
    const dayOfGoLive = PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE.toISOString()
    expect(isVisitDateAfterPIHuntAndDairyGoLive(dayOfGoLive)).toBe(true)
  })
  test('isVisitDateAfterGoLive returns false when visit date pre go live', () => {
    const dayBeforeGoLive = new Date(PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE)
    dayBeforeGoLive.setDate(dayBeforeGoLive.getDate() - 1)
    expect(isVisitDateAfterPIHuntAndDairyGoLive(dayBeforeGoLive.toISOString())).toBe(false)
  })
  test('isVisitDateAfterGoLive returns true when visit date post go live', () => {
    const dayBeforeGoLive = new Date(PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE)
    dayBeforeGoLive.setDate(dayBeforeGoLive.getDate() + 1)
    expect(isVisitDateAfterPIHuntAndDairyGoLive(dayBeforeGoLive.toISOString())).toBe(true)
  })

  test('isMultipleHerdsUserJourney, returns false when visit date before go-live', () => {
    expect(isMultipleHerdsUserJourney('2025-04-30T00:00:00.000Z', [])).toBe(false)
  })
  test('isMultipleHerdsUserJourney, returns false when reject T&Cs flag', () => {
    expect(
      isMultipleHerdsUserJourney('2025-05-01T00:00:00.000Z', [
        { appliesToMh: false },
        { appliesToMh: true }
      ])
    ).toBe(false)
  })
  test('isMultipleHerdsUserJourney, returns true when visit date on/after go-live and no flags', () => {
    expect(isMultipleHerdsUserJourney('2025-06-26T00:00:00.000Z', [])).toBe(true)
  })
  test('isMultipleHerdsUserJourney, returns true when visit date on/after go-live and no reject T&Cs flag', () => {
    expect(isMultipleHerdsUserJourney('2025-06-26T00:00:00.000Z', [{ appliesToMh: false }])).toBe(
      true
    )
  })

  describe('isPigsAndPaymentsUserJourney', () => {
    it('should return true when visit date on golive', () => {
      expect(isPigsAndPaymentsUserJourney('2026-01-22T00:00:00.000Z')).toBe(true)
    })

    it('should return true when visit date after golive', () => {
      expect(isPigsAndPaymentsUserJourney('2026-01-23T00:00:00.000Z')).toBe(true)
    })

    it('should return false when visit date before golive', () => {
      expect(isPigsAndPaymentsUserJourney('2026-01-21T00:00:00.000Z')).toBe(false)
    })
  })

  describe('getHerdName', () => {
    it('returns the name from the claim when present', () => {
      const actual = getHerdName({ herd: { name: 'some' } })
      expect(actual).toBe('some')
    })

    it('returns the default name for the live stock when name not present', () => {
      const actual = getHerdName({ herd: {}, data: { typeOfLivestock: TYPE_OF_LIVESTOCK.SHEEP } })
      expect(actual).toBe('Unnamed flock')
    })

    it('returns the default name for the live stock when herd not present', () => {
      const actual = getHerdName({ data: { typeOfLivestock: TYPE_OF_LIVESTOCK.SHEEP } })
      expect(actual).toBe('Unnamed flock')
    })
  })

  describe('getUnnamedHerdValueByTypeOfLivestock', () => {
    it('returns unnamed flock for sheep', () => {
      const actual = getUnnamedHerdValueByTypeOfLivestock(TYPE_OF_LIVESTOCK.SHEEP)
      expect(actual).toBe('Unnamed flock')
    })

    it('returns unnamed herd for beef', () => {
      const actual = getUnnamedHerdValueByTypeOfLivestock(TYPE_OF_LIVESTOCK.BEEF)
      expect(actual).toBe('Unnamed herd')
    })

    it('returns unnamed herd for beef', () => {
      const actual = getUnnamedHerdValueByTypeOfLivestock(TYPE_OF_LIVESTOCK.PIGS)
      expect(actual).toBe('Unnamed herd')
    })
  })
})
