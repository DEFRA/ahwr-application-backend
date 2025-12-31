import wreck from '@hapi/wreck'
import { getHolidayCalendarForEngland } from './holidays.js'
import { getLogger } from '../logging/logger.js'

jest.mock('@hapi/wreck')
jest.mock('../logging/logger.js')

describe('getHolidayCalendarForEngland', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('returns the events array for England and Wales when payload is valid', async () => {
    const fakeEvents = [
      { title: 'New Year', date: '2026-01-01' },
      { title: 'Good Friday', date: '2026-04-03' }
    ]
    wreck.get.mockResolvedValue({ payload: { 'england-and-wales': { events: fakeEvents } } })

    const result = await getHolidayCalendarForEngland()

    expect(result).toEqual(fakeEvents)
    expect(wreck.get).toHaveBeenCalledWith('https://www.gov.uk/bank-holidays.json', { json: true })
  })

  it('throws an error if payload is missing england-and-wales', async () => {
    wreck.get.mockResolvedValue({ payload: {} })
    const mockErrorFn = jest.fn()
    const mockLogger = { error: mockErrorFn }
    getLogger.mockReturnValue(mockLogger)

    await expect(getHolidayCalendarForEngland()).rejects.toThrow(
      'bank holidays response missing events'
    )
    expect(mockErrorFn).toHaveBeenCalled()
  })

  it('throws an error if payload.england-and-wales.events is missing', async () => {
    wreck.get.mockResolvedValue({ payload: { 'england-and-wales': {} } })
    const mockErrorFn = jest.fn()
    const mockLogger = { error: mockErrorFn }
    getLogger.mockReturnValue(mockLogger)

    await expect(getHolidayCalendarForEngland()).rejects.toThrow(
      'bank holidays response missing events'
    )
    expect(mockErrorFn).toHaveBeenCalled()
  })

  it('logs and rethrows an error if wreck.get throws', async () => {
    const fakeError = new Error('network failed')
    wreck.get.mockRejectedValue(fakeError)
    const mockErrorFn = jest.fn()
    const mockLogger = { error: mockErrorFn }
    getLogger.mockReturnValue(mockLogger)

    await expect(getHolidayCalendarForEngland()).rejects.toThrow(fakeError)
    expect(mockErrorFn).toHaveBeenCalledWith({ err: fakeError })
  })
})
