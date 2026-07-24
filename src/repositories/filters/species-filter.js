const POULTRY_SPECIES = 'poultry'

export const applySpeciesFilter = (query, species) => {
  if (!species) {
    return
  }

  // Poultry claims store their species in data.typesOfPoultry (ducks, geese,
  // turkeys, hens), never in data.typeOfLivestock, so match on that field's
  // presence to return every poultry claim.
  if (species === POULTRY_SPECIES) {
    query['data.typesOfPoultry'] = { $exists: true }
    return
  }

  query['data.typeOfLivestock'] = species
}
