import { applySpeciesFilter } from './species-filter.js'

describe('applySpeciesFilter', () => {
  it('does not restrict when species is absent', () => {
    const query = {}

    applySpeciesFilter(query, undefined)

    expect(query).toEqual({})
  })

  it('restricts by the given species', () => {
    const query = {}

    applySpeciesFilter(query, 'sheep')

    expect(query).toEqual({ 'data.typeOfLivestock': 'sheep' })
  })

  it('matches all poultry claims when species is poultry', () => {
    const query = {}

    applySpeciesFilter(query, 'poultry')

    expect(query).toEqual({ 'data.typesOfPoultry': { $exists: true } })
  })
})
