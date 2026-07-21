import { applyFlagFilter } from './flag-filter.js'

describe('applyFlagFilter', () => {
  it('restricts to applications with at least one non-deleted flag for FLAGGED', () => {
    const query = {}

    applyFlagFilter(query, 'FLAGGED')

    expect(query).toEqual({ flags: { $elemMatch: { deleted: { $ne: true } } } })
  })

  it('restricts to applications with no non-deleted flags for NOT_FLAGGED', () => {
    const query = {}

    applyFlagFilter(query, 'NOT_FLAGGED')

    expect(query).toEqual({ flags: { $not: { $elemMatch: { deleted: { $ne: true } } } } })
  })

  it('does not restrict when flag is absent', () => {
    const query = {}

    applyFlagFilter(query, undefined)

    expect(query).toEqual({})
  })

  it('does not restrict when flag is explicitly ALL', () => {
    const query = {}

    applyFlagFilter(query, 'ALL')

    expect(query).toEqual({})
  })

  it('does not restrict when flag is an unknown value', () => {
    const query = {}

    applyFlagFilter(query, 'NONSENSE')

    expect(query).toEqual({})
  })
})
