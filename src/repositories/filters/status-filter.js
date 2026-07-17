export const applyStatusFilter = (query, status) => {
  if (!status) {
    return
  }

  query.status = status
}
