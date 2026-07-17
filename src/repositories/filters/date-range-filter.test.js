import { applyDateRangeFilter } from './date-range-filter.js'

describe('applyDateRangeFilter', () => {
  const from = new Date('2025-01-01T00:00:00.000Z')
  const to = new Date('2025-12-31T23:59:59.999Z')

  it('does not restrict when both bounds are absent', () => {
    const query = {}

    applyDateRangeFilter(query, undefined, undefined)

    expect(query).toEqual({})
  })

  it('applies a lower bound when only dateFrom is given', () => {
    const query = {}

    applyDateRangeFilter(query, from, undefined)

    expect(query).toEqual({ createdAt: { $gte: from } })
  })

  it('applies an upper bound when only dateTo is given', () => {
    const query = {}

    applyDateRangeFilter(query, undefined, to)

    expect(query).toEqual({ createdAt: { $lte: to } })
  })

  it('applies both bounds when the full range is given', () => {
    const query = {}

    applyDateRangeFilter(query, from, to)

    expect(query).toEqual({ createdAt: { $gte: from, $lte: to } })
  })
})
