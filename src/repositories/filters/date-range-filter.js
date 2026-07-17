export const applyDateRangeFilter = (query, dateFrom, dateTo) => {
  if (!dateFrom && !dateTo) {
    return
  }

  query.createdAt = {
    ...(dateFrom && { $gte: dateFrom }),
    ...(dateTo && { $lte: dateTo })
  }
}
