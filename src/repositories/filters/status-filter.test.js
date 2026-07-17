import { applyStatusFilter } from './status-filter.js'

describe('applyStatusFilter', () => {
  it('does not restrict when status is absent', () => {
    const query = {}

    applyStatusFilter(query, undefined)

    expect(query).toEqual({})
  })

  it('restricts by the given status', () => {
    const query = {}

    applyStatusFilter(query, 'AGREED')

    expect(query).toEqual({ status: 'AGREED' })
  })
})
