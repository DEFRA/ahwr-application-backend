export const applyClaimTypeFilter = (query, claimType) => {
  if (!claimType || claimType === 'ALL') {
    return
  }

  query.type = claimType
}
