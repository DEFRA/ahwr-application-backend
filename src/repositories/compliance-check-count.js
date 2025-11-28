const COLLECTION = 'compliancecheckcount'

export const getAndIncrementComplianceCheckCount = async (db) => {
  const now = new Date()

  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: 1 },
    {
      $inc: { count: 1 },
      $set: { updatedAt: now },
      $setOnInsert: { createdAt: now }
    },
    {
      upsert: true,
      returnDocument: 'after'
    }
  )

  return result.count
}
