export const createStatusHistory = async (data) => {
  // TODO 1182 impl
  return {}

  // return models.status_history.create(data)
}

export const getHistoryByReference = async (db, reference) => {
  return await db
    .collection('status_history')
    .find({ reference }, { projection: { _id: 0 } })
    .toArray()
}
