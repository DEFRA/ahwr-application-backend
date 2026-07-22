export const applySpeciesFilter = (query, species) => {
  if (!species) {
    return
  }

  query['data.typeOfLivestock'] = species
}
