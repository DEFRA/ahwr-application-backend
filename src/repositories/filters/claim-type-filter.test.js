import { applyClaimTypeFilter } from './claim-type-filter.js'

describe('applyClaimTypeFilter', () => {
  it('does not restrict when claimType is absent', () => {
    const query = {}

    applyClaimTypeFilter(query, undefined)

    expect(query).toEqual({})
  })

  it('does not restrict when claimType is ALL', () => {
    const query = {}

    applyClaimTypeFilter(query, 'ALL')

    expect(query).toEqual({})
  })

  it('restricts by the given claimType', () => {
    const query = {}

    applyClaimTypeFilter(query, 'REVIEW')

    expect(query).toEqual({ type: 'REVIEW' })
  })

  it('restricts by FOLLOW_UP', () => {
    const query = {}

    applyClaimTypeFilter(query, 'FOLLOW_UP')

    expect(query).toEqual({ type: 'FOLLOW_UP' })
  })
})
